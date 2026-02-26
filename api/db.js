// db.js — Pool de conexão seguro com MySQL
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Testa a conexão ao iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL conectado com sucesso!');
    conn.release();
  } catch (err) {
    console.error('❌ Erro ao conectar MySQL:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;