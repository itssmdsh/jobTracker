import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { runScraper } from './scraper.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Translate existing URLs via Supabase mapping table
app.post('/api/translate-links', async (req, res) => {
  try {
    const { urls } = req.body || {};
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing "urls" array in request body.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    const tableName = process.env.SUPABASE_TABLE_NAME || 'links';

    if (!supabaseUrl || !supabaseKey) {
      return res.json({ mappings: {} });
    }

    const batchSize = 30;
    const mappings = {};

    for (let i = 0; i < urls.length; i += batchSize) {
      const batchUrls = urls.slice(i, i + batchSize);
      const filterStr = batchUrls.map(u => `"${u.replace(/"/g, '\\"')}"`).join(',');

      const response = await axios.get(`${supabaseUrl}/rest/v1/${tableName}`, {
        params: {
          select: 'source_url,apply_url',
          source_url: `in.(${filterStr})`
        },
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        timeout: 8000
      });

      if (Array.isArray(response.data)) {
        for (const row of response.data) {
          if (row.source_url && row.apply_url) {
            mappings[row.source_url] = row.apply_url;
          }
        }
      }
    }

    console.log(`[Translate] Translated ${Object.keys(mappings).length} of ${urls.length} URLs.`);
    res.json({ mappings });
  } catch (error) {
    console.error('[Translate] Failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Stateless Scrape API
app.post('/api/scrape', async (req, res) => {
  try {
    const { channels, timeframe } = req.body || {};
    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({ error: 'Invalid or missing "channels" array in request body.' });
    }
    
    let links = await runScraper(channels, timeframe || 'all');
    
    // Supabase URL Translation Integration
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    const tableName = process.env.SUPABASE_TABLE_NAME || 'links';
    
    if (supabaseUrl && supabaseKey && links.length > 0) {
      try {
        console.log(`[Supabase] Translating scraped links via table '${tableName}'...`);
        const batchSize = 30;
        const mappings = {}; // source_url -> apply_url
        const urls = links.map(l => typeof l === 'string' ? l : l.url);
        
        for (let i = 0; i < urls.length; i += batchSize) {
          const batchUrls = urls.slice(i, i + batchSize);
          const filterStr = batchUrls.map(u => `"${u.replace(/"/g, '\\"')}"`).join(',');
          
          const response = await axios.get(`${supabaseUrl}/rest/v1/${tableName}`, {
            params: {
              select: 'source_url,apply_url',
              source_url: `in.(${filterStr})`
            },
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            timeout: 5000
          });
          
          if (Array.isArray(response.data)) {
            for (const row of response.data) {
              if (row.source_url && row.apply_url) {
                mappings[row.source_url] = row.apply_url;
              }
            }
          }
        }
        
        links = links.map(item => {
          const urlStr = typeof item === 'string' ? item : item.url;
          if (mappings[urlStr]) {
            console.log(`[Supabase] Match translated: ${urlStr} -> ${mappings[urlStr]}`);
            if (typeof item === 'string') {
              return mappings[urlStr];
            } else {
              return {
                ...item,
                url: mappings[urlStr]
              };
            }
          }
          return item;
        });
      } catch (err) {
        console.error('[Supabase] Failed to translate links:', err.message);
      }
    }
    
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
