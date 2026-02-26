/ routes/leads.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { verifyToken } = require('../auth');

// GET /api/leads — Listar todos (protegido)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM leads ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads — Criar novo lead (público — chamado pelo form)
router.post('/', async (req, res) => {
  const { nome, email, telefone, cidade } = req.body;
  if (!nome || !email || !telefone || !cidade) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO leads (nome, email, telefone, cidade) VALUES (?, ?, ?, ?)',
      [nome, email, telefone, cidade]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/leads/:id — Atualizar lead (protegido)
router.put('/:id', verifyToken, async (req, res) => {
  const { nome, email, telefone, cidade } = req.body;
  try {
    await pool.query(
      'UPDATE leads SET nome=?, email=?, telefone=?, cidade=? WHERE id=?',
      [nome, email, telefone, cidade, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leads/:id — Excluir lead (protegido)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM leads WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;