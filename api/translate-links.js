import axios from 'axios';

export default async function handler(req, res) {
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
    const { urls } = req.body || {};

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing "urls" array in request body.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    const tableName = process.env.SUPABASE_TABLE_NAME || 'links';

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[translate-links] Supabase env vars not set. Returning empty mappings.');
      return res.status(200).json({ mappings: {} });
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

    console.log(`[translate-links] Translated ${Object.keys(mappings).length} of ${urls.length} URLs.`);
    return res.status(200).json({ mappings });

  } catch (error) {
    console.error('[translate-links] Failed:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
