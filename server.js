import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Zero-cookie, privacy-friendly visitor counter
const VISITS_FILE = path.join(__dirname, 'visits.json');

function getVisits() {
  try {
    if (fs.existsSync(VISITS_FILE)) {
      const data = JSON.parse(fs.readFileSync(VISITS_FILE, 'utf-8'));
      return typeof data.count === 'number' ? data.count : 42;
    }
  } catch (_) {}
  return 42;
}

function saveVisits(count) {
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify({ count }), 'utf-8');
  } catch (_) {}
}

app.get('/api/visits', (req, res) => {
  res.json({ count: getVisits() });
});

app.post('/api/visits', (req, res) => {
  const next = getVisits() + 1;
  saveVisits(next);
  res.json({ count: next });
});

// Serve static assets and html pages
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html'
}));

// Route fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
