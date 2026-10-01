import { Router } from 'express';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password === process.env.ADMIN_PASSWORD) return res.json({ role: 'admin' });
  if (password === process.env.FEEDBACK_PASSWORD) return res.json({ role: 'feedback' });
  return res.status(401).json({ error: 'Incorrect password' });
});

export default router;
