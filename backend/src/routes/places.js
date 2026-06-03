import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /places — listagem com filtros opcionais
// Query params: category, region_id, min_rating, search, limit, offset
router.get('/', requireAuth, async (req, res) => {
  const { category, region_id, min_rating, search, limit = 20, offset = 0 } = req.query;

  let q = supabase
    .from('places')
    .select('id, name, category, address, latitude, longitude, avg_rating, region_id, created_by, created_at')
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (category) q = q.eq('category', category);
  if (region_id) q = q.eq('region_id', region_id);
  if (min_rating) q = q.gte('avg_rating', Number(min_rating));
  if (search) q = q.ilike('name', `%${search}%`);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// GET /places/map — dados para o mapa
// Query params:
//   filter=todos | rampas | calcadas | 4estrelas
router.get('/map', requireAuth, async (req, res) => {
  const { filter = 'todos' } = req.query;

  const [levelRes, coordRes] = await Promise.all([
    supabase
      .from('places_accessibility_level')
      .select('id, name, avg_rating, accessibility_level'),
    supabase.from('places').select('id, latitude, longitude'),
  ]);

  if (levelRes.error) return res.status(500).json({ error: levelRes.error.message });
  if (coordRes.error) return res.status(500).json({ error: coordRes.error.message });

  const coordMap = Object.fromEntries(coordRes.data.map((p) => [p.id, p]));

  let merged = levelRes.data
    .map((p) => ({
      ...p,
      latitude: coordMap[p.id]?.latitude ?? null,
      longitude: coordMap[p.id]?.longitude ?? null,
    }))
    .filter((p) => p.latitude != null && p.longitude != null);

  // Filtro: 4 estrelas ou mais
  if (filter === '4estrelas') {
    merged = merged.filter((p) => Number(p.avg_rating) >= 4);
  }

  // Filtros de critério de acessibilidade — agrega via accessibility_checklist
  if (filter === 'rampas' || filter === 'calcadas') {
    const coluna = filter === 'rampas' ? 'ramp' : 'sidewalk';

    const { data: checklists, error: cerr } = await supabase
      .from('accessibility_checklist')
      .select(`${coluna}, reviews ( place_id )`)
      .eq(coluna, true);

    if (cerr) return res.status(500).json({ error: cerr.message });

    const placeIdsComCriterio = new Set(
      checklists.map((c) => c.reviews?.place_id).filter(Boolean)
    );
    merged = merged.filter((p) => placeIdsComCriterio.has(p.id));
  }

  return res.json(merged);
});

// GET /places/:id/summary — resumo completo: info + contagem + critérios agregados
router.get('/:id/summary', requireAuth, async (req, res) => {
  const { id } = req.params;

  const [placeRes, reviewsRes] = await Promise.all([
    supabase.from('places').select('*, regions(name)').eq('id', id).maybeSingle(),
    supabase
      .from('reviews')
      .select(`
        id, rating,
        accessibility_checklist (
          ramp, sidewalk, sound_signaling, tactile_floor,
          disabled_parking, elevator, accessible_bathroom
        )
      `)
      .eq('place_id', id),
  ]);

  if (placeRes.error) return res.status(500).json({ error: placeRes.error.message });
  if (!placeRes.data)  return res.status(404).json({ error: 'Local não encontrado.' });

  const reviews    = reviewsRes.data ?? [];
  const totalReviews = reviews.length;

  // Agrega critérios: true se pelo menos 1 review marcou o critério
  const CRITERIOS = ['ramp', 'sidewalk', 'sound_signaling', 'tactile_floor', 'disabled_parking', 'elevator', 'accessible_bathroom'];
  const criteria  = Object.fromEntries(
    CRITERIOS.map((k) => [k, reviews.some((r) => r.accessibility_checklist?.[k] === true)])
  );

  const avg    = placeRes.data.avg_rating ?? 0;
  const nivel  = avg >= 4 ? 'green' : avg >= 2.5 ? 'orange' : 'red';
  const label  = nivel === 'green' ? 'Acessível' : nivel === 'orange' ? 'Parcialmente acessível' : 'Pouco acessível';

  return res.json({
    ...placeRes.data,
    region_name:    placeRes.data.regions?.name ?? null,
    review_count:   totalReviews,
    criteria,
    accessibility_level: nivel,
    accessibility_label: label,
  });
});

// GET /places/:id — detalhes completos de um local
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('places')
    .select('*, regions(name)')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Local não encontrado.' });
  return res.json(data);
});

// POST /places — cadastro de novo local
router.post(
  '/',
  requireAuth,
  [
    body('name').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('address').trim().notEmpty(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('region_id').optional().isUUID(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, category, address, latitude, longitude, region_id } = req.body;

    const { data, error } = await supabase
      .from('places')
      .insert({ name, category, address, latitude, longitude, region_id: region_id ?? null, created_by: req.user.id })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
);

// GET /places/:placeId/reviews — avaliações de um local com perfil e checklist
router.get('/:placeId/reviews', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, created_at, updated_at, user_id,
      accessibility_checklist (
        ramp, sidewalk, sound_signaling, tactile_floor,
        disabled_parking, elevator, accessible_bathroom
      )
    `)
    .eq('place_id', req.params.placeId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Busca os perfis separadamente (não há FK direta reviews→profiles para o PostgREST embutir)
  const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
  const { data: perfis } = userIds.length
    ? await supabase.from('profiles').select('user_id, name, avatar_url').in('user_id', userIds)
    : { data: [] };
  const perfilPorUser = Object.fromEntries((perfis ?? []).map((p) => [p.user_id, p]));

  const resultado = (data ?? []).map((r) => ({
    ...r,
    profiles: {
      name: perfilPorUser[r.user_id]?.name ?? null,
      avatar_url: perfilPorUser[r.user_id]?.avatar_url ?? null,
    },
  }));

  return res.json(resultado);
});

export default router;
