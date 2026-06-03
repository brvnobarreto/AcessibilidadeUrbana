import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /reviews — cria avaliação + checklist de acessibilidade
router.post(
  '/',
  requireAuth,
  [
    body('place_id').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString().trim(),
    body('ramp').optional().isBoolean(),
    body('sidewalk').optional().isBoolean(),
    body('sound_signaling').optional().isBoolean(),
    body('tactile_floor').optional().isBoolean(),
    body('disabled_parking').optional().isBoolean(),
    body('elevator').optional().isBoolean(),
    body('accessible_bathroom').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      place_id, rating, comment,
      ramp = false, sidewalk = false, sound_signaling = false,
      tactile_floor = false, disabled_parking = false,
      elevator = false, accessible_bathroom = false,
    } = req.body;

    // Verifica se o usuário já avaliou este local
    const { data: existente } = await supabase
      .from('reviews')
      .select('id')
      .eq('place_id', place_id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (existente) {
      return res.status(409).json({ error: 'Você já avaliou este local.' });
    }

    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .insert({ place_id, user_id: req.user.id, rating, comment: comment ?? null })
      .select('id, place_id, user_id, rating, comment, created_at')
      .single();

    if (reviewErr) return res.status(500).json({ error: reviewErr.message });

    const { error: checkErr } = await supabase
      .from('accessibility_checklist')
      .insert({
        review_id: review.id,
        ramp, sidewalk, sound_signaling,
        tactile_floor, disabled_parking,
        elevator, accessible_bathroom,
      });

    if (checkErr) {
      console.error('Erro ao criar checklist:', checkErr.message);
    }

    return res.status(201).json(review);
  }
);

// GET /reviews/place/:placeId — reviews de um local (alias conveniente)
router.get('/place/:placeId', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, created_at, user_id,
      accessibility_checklist (
        ramp, sidewalk, sound_signaling, tactile_floor,
        disabled_parking, elevator, accessible_bathroom
      )
    `)
    .eq('place_id', req.params.placeId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Busca os perfis separadamente (sem FK direta reviews→profiles para o PostgREST embutir)
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
