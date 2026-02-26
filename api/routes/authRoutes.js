// routes/authRoutes.js
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db');
const { verifyToken } = require('../auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user     = rows[0];
    const isMatch  = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — Verifica se sessão é válida
router.get('/me', verifyToken, (req, res) => {
  res.json({ email: req.user.email });
});

module.exports = router;