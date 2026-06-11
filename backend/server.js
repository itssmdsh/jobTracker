import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runScraper } from './scraper.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Stateless Scrape API
app.post('/api/scrape', async (req, res) => {
  try {
    const { channels, timeframe } = req.body || {};
    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({ error: 'Invalid or missing "channels" array in request body.' });
    }
    const links = await runScraper(channels, timeframe || 'all');
    res.json({ success: true, links });
  } catch (error) {
    console.error("[API] Scrape failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve Frontend in Production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] Express API server running on http://localhost:${PORT}`);
});
