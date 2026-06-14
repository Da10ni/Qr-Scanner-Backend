import { Router } from 'express';
import Feedback from '../models/Feedback.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, category, rating, message } = req.body || {};
    if (!name || !email || !category || !rating || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }
    const doc = await Feedback.create({ name, email, category, rating: ratingNum, message });
    res.status(201).json({ id: doc._id });
  } catch (err) {
    console.error('POST /feedback failed:', err.message);
    res.status(500).json({ error: 'Could not save feedback' });
  }
});

router.get('/', requireAuth, async (_req, res) => {
  const items = await Feedback.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await Feedback.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
