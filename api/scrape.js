import { runScraper } from '../backend/scraper.js';

export default async function handler(req, res) {
  // Handle CORS options request
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { channels, timeframe } = req.body || {};
    
    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({ error: 'Invalid or missing "channels" array in request body.' });
    }

    console.log(`[Vercel Serverless] Starting scrape on-the-fly for ${channels.length} channels (timeframe: ${timeframe})`);
    
    const links = await runScraper(channels, timeframe || 'all');
    
    res.status(200).json({ success: true, links });
  } catch (error) {
    console.error('[Vercel Serverless] Scrape failed:', error);
    res.status(500).json({ error: error.message });
  }
}
