const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const RAW_DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const VALID_DB_URL = /^postgres(ql)?:\/\/[^@]+@[^/]+\/[^?]+/i.test(RAW_DB_URL);
const DATABASE_URL = VALID_DB_URL ? RAW_DB_URL : '';
const HAS_DB = !!DATABASE_URL;
const useSSL = /neon\.tech|sslmode=require|render/i.test(DATABASE_URL);
const pool = HAS_DB ? new Pool({ connectionString: DATABASE_URL, ssl: useSSL ? { rejectUnauthorized: false } : false }) : null;

async function ensureSchema() {
  if(!pool) return; 
  await pool.query(`
    CREATE TABLE IF NOT EXISTS carousel (
      id SERIAL PRIMARY KEY,
      image TEXT NOT NULL,
      position INT NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS integridad_config (
      id BOOLEAN PRIMARY KEY DEFAULT TRUE,
      size TEXT DEFAULT '16px',
      color TEXT DEFAULT '#111827'
    );
    INSERT INTO integridad_config (id) VALUES (TRUE)
      ON CONFLICT (id) DO NOTHING;
    CREATE TABLE IF NOT EXISTS integridad_cards (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      text_only BOOLEAN DEFAULT FALSE,
      position INT NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      image TEXT NOT NULL,
      caption TEXT,
      position INT NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS footer_config (
      id BOOLEAN PRIMARY KEY DEFAULT TRUE,
      phone TEXT DEFAULT '2 190107',
      email TEXT DEFAULT 'cnt.pdhdlp@policia.gob.bo',
      address TEXT DEFAULT 'Av. 20 de Octubre esq. c/ Lisimaco Gutiérrez #2541'
    );
    INSERT INTO footer_config (id) VALUES (TRUE)
      ON CONFLICT (id) DO NOTHING;
    CREATE TABLE IF NOT EXISTS denuncias (
      id SERIAL PRIMARY KEY,
      fecha DATE NOT NULL,
      hora TEXT,
      image TEXT,
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS attachments JSONB;
  `);
}

app.use('/api', (req,res,next)=>{ 
  if(pool) return next();
  if(req.method === 'GET'){
    const p = req.path || '';
    if(p.startsWith('/health')) return res.json({ db: false, reason: 'no_database_url' });
    if(p.startsWith('/integridad/config')) return res.json({ size: '16px', color: '#111827' });
    if(p.startsWith('/footer')) return res.json({});
    return res.json([]);
  }
  return res.status(503).json({ error: 'base de datos no configurada' });
});

app.get('/api/health', async (req, res) => {
  res.type('application/json');
  if(!pool) return res.json({ db: false, reason: 'no_database_url' });
  const timeoutMs = 3000;
  try{
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
    ]);
    return res.json({ db: true });
  }catch(e){
    return res.status(503).json({ db: false, error: e.message === 'timeout' ? 'timeout' : e.message });
  }
});

// Carousel
app.get('/api/carousel', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM carousel ORDER BY position ASC, id ASC');
  res.json(rows);
});
app.post('/api/carousel', async (req, res) => {
  const { image, position } = req.body;
  if (!image) return res.status(400).json({ error: 'image requerido' });
  const { rows } = await pool.query('INSERT INTO carousel (image, position) VALUES ($1, $2) RETURNING *', [image, position || 0]);
  res.json(rows[0]);
});
app.delete('/api/carousel/:id', async (req, res) => {
  await pool.query('DELETE FROM carousel WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// News
app.get('/api/news', async (req, res) => {
  const limit = parseInt(req.query.limit || '0', 10);
  const q = limit > 0 ? 'SELECT * FROM news ORDER BY created_at DESC, id DESC LIMIT $1' : 'SELECT * FROM news ORDER BY created_at DESC, id DESC';
  const { rows } = limit > 0 ? await pool.query(q, [limit]) : await pool.query(q);
  res.json(rows);
});
app.get('/api/news/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'noticia no encontrada' });
  res.json(rows[0]);
});
app.post('/api/news', async (req, res) => {
  const { title, summary, content, image } = req.body;
  if (!title || !summary || !content) return res.status(400).json({ error: 'campos requeridos' });
  const { rows } = await pool.query(
    'INSERT INTO news (title, summary, content, image) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, summary, content, image || null]
  );
  res.json(rows[0]);
});
app.delete('/api/news/:id', async (req, res) => {
  await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Integridad config
app.get('/api/integridad/config', async (req, res) => {
  const { rows } = await pool.query('SELECT size, color FROM integridad_config WHERE id = TRUE');
  res.json(rows[0] || { size: '16px', color: '#111827' });
});
app.post('/api/integridad/config', async (req, res) => {
  const { size, color } = req.body;
  await pool.query('UPDATE integridad_config SET size = $1, color = $2 WHERE id = TRUE', [size || '16px', color || '#111827']);
  const { rows } = await pool.query('SELECT size, color FROM integridad_config WHERE id = TRUE');
  res.json(rows[0]);
});

// Integridad cards
app.get('/api/integridad/cards', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM integridad_cards ORDER BY position ASC, id ASC');
  res.json(rows);
});
app.post('/api/integridad/cards', async (req, res) => {
  const { title, content, image, text_only, position } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'campos requeridos' });
  const { rows } = await pool.query(
    'INSERT INTO integridad_cards (title, content, image, text_only, position) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [title, content, image || null, !!text_only, position || 0]
  );
  res.json(rows[0]);
});
app.delete('/api/integridad/cards/:id', async (req, res) => {
  await pool.query('DELETE FROM integridad_cards WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Gallery
app.get('/api/gallery', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM gallery ORDER BY position ASC, id ASC');
  res.json(rows);
});
app.post('/api/gallery', async (req, res) => {
  const { image, caption, position } = req.body;
  if (!image) return res.status(400).json({ error: 'image requerido' });
  const { rows } = await pool.query('INSERT INTO gallery (image, caption, position) VALUES ($1, $2, $3) RETURNING *', [image, caption || null, position || 0]);
  res.json(rows[0]);
});
app.delete('/api/gallery/:id', async (req, res) => {
  await pool.query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Footer config
app.get('/api/footer', async (req, res) => {
  const { rows } = await pool.query('SELECT phone, email, address FROM footer_config WHERE id = TRUE');
  res.json(rows[0] || {});
});
app.post('/api/footer', async (req, res) => {
  const { phone, email, address } = req.body;
  await pool.query('UPDATE footer_config SET phone = $1, email = $2, address = $3 WHERE id = TRUE', [phone || '', email || '', address || '']);
  const { rows } = await pool.query('SELECT phone, email, address FROM footer_config WHERE id = TRUE');
  res.json(rows[0]);
});

// Denuncias
app.post('/api/denuncias', async (req, res) => {
  const { fecha, hora, image, data, attachments } = req.body;
  if (!fecha || !image) return res.status(400).json({ error: 'campos requeridos' });
  const { rows } = await pool.query(
    'INSERT INTO denuncias (fecha, hora, image, data, attachments) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [fecha, hora || null, image, data || null, attachments || null]
  );
  res.json(rows[0]);
});
app.get('/api/denuncias', async (req, res) => {
  const { from, to } = req.query;
  let q = 'SELECT * FROM denuncias';
  const p = [];
  if (from || to) {
    q += ' WHERE 1=1';
    if (from) { p.push(from); q += ` AND fecha >= $${p.length}`; }
    if (to) { p.push(to); q += ` AND fecha <= $${p.length}`; }
  }
  q += ' ORDER BY fecha DESC, id DESC';
  const { rows } = p.length ? await pool.query(q, p) : await pool.query(q);
  res.json(rows);
});
app.get('/api/denuncias/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM denuncias WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'denuncia no encontrada' });
  res.json(rows[0]);
});

// Serve static
app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const port = process.env.PORT || 3000;
ensureSchema().then(() => {
  app.listen(port, () => console.log(`Servidor iniciado en puerto ${port}`));
}).catch((e) => {
  console.error('Error inicializando esquema', e);
  process.exit(1);
});
