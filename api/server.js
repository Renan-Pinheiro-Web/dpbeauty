// server.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const leadsRoute = require('./routes/leads');
const authRoute  = require('./routes/authRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Rotas
app.use('/api/leads', leadsRoute);
app.use('/api/auth',  authRoute);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});