import axios from 'axios';
import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';

// Setup XML Parser
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

// Helper to extract channel ID from various youtube URL formats
export async function getChannelIdFromUrl(url) {
  if (!url) return null;
  
  url = url.trim();
  
  // If it's already a channel ID (starts with UC and is 24 chars)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(url)) {
    return url;
  }
  
  // If it's a direct channel ID URL e.g. youtube.com/channel/UC...
  const channelIdMatch = url.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelIdMatch) return channelIdMatch[1];
  
  // If it's a handle e.g. youtube.com/@handle or just @handle
  let handle = null;
  const handleMatch = url.match(/@([a-zA-Z0-9._-]+)/);
  if (handleMatch) {
    handle = '@' + handleMatch[1];
  } else if (url.startsWith('@')) {
    handle = url;
  }
  
  // Fetch page HTML to extract channelId
  try {
    let fetchUrl = url;
    if (handle) {
      fetchUrl = `https://www.youtube.com/${handle}`;
    }
    
    const response = await axios.get(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    });
    
    const html = response.data;
    
    // Look for channel ID in page source
    const metaMatch = html.match(/<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})"/);
    if (metaMatch) return metaMatch[1];

    const jsonMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
    if (jsonMatch) return jsonMatch[1];

    const externalIdMatch = html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/);
    if (externalIdMatch) return externalIdMatch[1];

    const rssMatch = html.match(/href="https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]{22})"/);
    if (rssMatch) return rssMatch[1];

    const canonicalMatch = html.match(/href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})"/);
    if (canonicalMatch) return canonicalMatch[1];

    console.warn(`Could not extract YouTube channel ID for URL: ${url}`);
    return null;
  } catch (error) {
    console.error(`Error resolving channel ID for URL ${url}:`, error.message);
    return null;
  }
}

export function isSpamOrExcluded(link) {
  try {
    const parsed = new URL(link);
    const host = parsed.hostname.toLowerCase();
    
    // 1. Exclude social networking, media, and chat/communication platform links
    if (
      host.includes('youtube.com') || 
      host.includes('youtu.be') ||
      host.includes('whatsapp.com') ||
      host.includes('wa.me') ||
      host.includes('t.me') ||
      host.includes('telegram.me') ||
      host.includes('telegram.dog') ||
      host.includes('telegram.org') ||
      ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'].some(d => host.includes(d))
    ) {
      return true;
    }
    
    // 2. Exclude user-specified spam, affiliate, and promotion/course platforms
    if (
      host.includes('atsbasedresume.com') ||
      host.includes('courses.store') ||
      host.includes('topmate.io') ||
      host.includes('drive.google.com') ||
      host.includes('leetcode.com')
    ) {
      return true;
    }
    
    return false;
  } catch (e) {
    return true; // Invalid URLs are excluded
  }
}

// Regex to extract absolute URLs
export function extractUrls(text) {
  if (!text) return [];
  const regex = /(https?:\/\/[^\s"'<>\(\)]+)/gi;
  const urls = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    let link = match[1];
    
    // Clean trailing punctuation
    link = link.replace(/[.,;:!?)]+$/, '');
    
    // Clean trailing parenthesis if unmatched
    const openCount = (link.match(/\(/g) || []).length;
    const closeCount = (link.match(/\)/g) || []).length;
    if (closeCount > openCount) {
      link = link.slice(0, -1);
    }
    
    if (!isSpamOrExcluded(link)) {
      urls.push(link);
    }
  }
  return [...new Set(urls)];
}

// Scrape YouTube Channel RSS Feed
async function scrapeYouTube(channelUrl, cutoffDate) {
  const channelId = await getChannelIdFromUrl(channelUrl);
  if (!channelId) {
    console.error(`Skipping YouTube scrape for ${channelUrl} due to unresolved Channel ID.`);
    return [];
  }
  
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });
    
    const jsonObj = xmlParser.parse(response.data);
    let entries = jsonObj?.feed?.entry || [];
    if (!Array.isArray(entries)) {
      entries = [entries];
    }
    
    const extractedUrls = [];
    for (const entry of entries) {
      // Timeframe check based on publication date
      if (cutoffDate && entry.published) {
        const publishedDate = new Date(entry.published);
        if (publishedDate < cutoffDate) {
          continue; // Skip videos uploaded before the cutoff date
        }
      }

      let description = '';
      const mediaGroup = entry?.['media:group'];
      if (mediaGroup && mediaGroup['media:description']) {
        description = mediaGroup['media:description'];
      } else if (entry?.['media:description']) {
        description = entry['media:description'];
      } else if (entry?.summary) {
        description = entry.summary;
      }
      
      const urls = extractUrls(description);
      extractedUrls.push(...urls);
    }
    
    return [...new Set(extractedUrls)];
  } catch (error) {
    console.error(`Error fetching or parsing RSS for ${channelUrl}:`, error.message);
    return [];
  }
}

// Scrape Generic Website (e.g. jobcode.in)
async function scrapeWebsite(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    const urls = [];
    const siteUrl = new URL(url);
    const siteDomain = siteUrl.hostname.replace('www.', '');
    
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const resolved = new URL(href, url).href;
          const parsed = new URL(resolved);
          
          if (parsed.protocol.startsWith('http')) {
            const targetDomain = parsed.hostname.replace('www.', '');
            const pathname = parsed.pathname.toLowerCase();
            
            // Filter out YouTube, WhatsApp, Telegram, and specified spam domains
            if (isSpamOrExcluded(resolved)) {
              return;
            }

            // For internal pages, filter out standard non-job boilerplate links
            if (targetDomain === siteDomain) {
              if (pathname === '/' || pathname === '') {
                return;
              }
              const boilerplatePatterns = [
                '/about', '/contact', '/privacy', '/terms', '/disclaimer',
                '/category/', '/tag/', '/page/', '/wp-admin', '/feed',
                '/author', '/xmlrpc', '/wp-content', '/wp-includes'
              ];
              if (boilerplatePatterns.some(pattern => pathname.includes(pattern))) {
                return;
              }
            }

            // Exclude static asset resources
            if (/\.(png|jpe?g|gif|svg|css|js|pdf|ico|zip|rar)$/i.test(pathname)) {
              return;
            }

            urls.push(resolved);
          }
        } catch (e) {
          // Skip invalid
        }
      }
    });
    
    return [...new Set(urls)];
  } catch (error) {
    console.error(`Error scraping website ${url}:`, error.message);
    return [];
  }
}

// Scrape Telegram Public Channel Preview (t.me/s/)
async function scrapeTelegramChannel(url, cutoffDate) {
  let channelName = '';
  const match = url.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_-]+)/i);
  if (match) {
    channelName = match[1];
  } else {
    console.error(`Invalid Telegram URL: ${url}`);
    return [];
  }

  const previewUrl = `https://t.me/s/${channelName}`;
  console.log(`[Scraper] Scraping public Telegram preview: ${previewUrl}`);
  try {
    const response = await axios.get(previewUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    const urls = [];

    // Parse message containers to apply timeframe filter on post date
    $('.tgme_widget_message').each((i, el) => {
      const timeEl = $(el).find('time.time');
      const datetime = timeEl.attr('datetime');
      if (cutoffDate && datetime) {
        const msgDate = new Date(datetime);
        if (msgDate < cutoffDate) {
          return; // Skip messages sent before the cutoff date
        }
      }

      // Parse links within message texts
      $(el).find('.tgme_widget_message_text a').each((j, aEl) => {
        const href = $(aEl).attr('href');
        if (href) {
          try {
            const resolved = new URL(href).href;
            const parsed = new URL(resolved);
            const targetDomain = parsed.hostname.toLowerCase().replace('www.', '');

            // Filter out YouTube, WhatsApp, Telegram, and specified spam domains
            if (isSpamOrExcluded(resolved)) {
              return;
            }

            urls.push(resolved);
          } catch (e) {
            // Skip invalid
          }
        }
      });
    });

    return [...new Set(urls)];
  } catch (error) {
    console.error(`Error scraping Telegram channel ${url}:`, error.message);
    return [];
  }
}

// Main scrape runner
export async function runScraper(channels = [], timeframe = 'all') {
  console.log(`[Scraper] Starting scrape run at ${new Date().toISOString()} (channels: ${channels.length}, timeframe: ${timeframe})`);
  
  if (!channels || channels.length === 0) {
    console.log("[Scraper] No channels provided. Aborting scrape.");
    return [];
  }
  
  // Calculate Cutoff Date
  let cutoffDate = null;
  const now = Date.now();
  if (timeframe === '24h') cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
  else if (timeframe === '48h') cutoffDate = new Date(now - 48 * 60 * 60 * 1000);
  else if (timeframe === '72h') cutoffDate = new Date(now - 72 * 60 * 60 * 1000);
  else if (timeframe === '1w') cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Map each channel to a scrape promise for parallel execution
  const scrapePromises = channels.map(async (channelUrl) => {
    try {
      console.log(`[Scraper] Starting processing for source: ${channelUrl}`);
      let urls = [];
      
      const isYoutube = channelUrl.toLowerCase().includes('youtube.com') || 
                        channelUrl.toLowerCase().includes('youtu.be') || 
                        channelUrl.startsWith('@');
                        
      const isTelegram = channelUrl.toLowerCase().includes('t.me') || 
                         channelUrl.toLowerCase().includes('telegram.me');

      if (isYoutube) {
        urls = await scrapeYouTube(channelUrl, cutoffDate);
      } else if (isTelegram) {
        urls = await scrapeTelegramChannel(channelUrl, cutoffDate);
      } else {
        urls = await scrapeWebsite(channelUrl);
      }
      
      console.log(`[Scraper] Found ${urls.length} links for source ${channelUrl}`);
      return urls;
    } catch (err) {
      console.error(`[Scraper] Error scraping source ${channelUrl}:`, err.message);
      return [];
    }
  });

  // Run all scrapes in parallel
  const results = await Promise.all(scrapePromises);
  
  // Flatten and deduplicate combined list
  const allUrls = results.flat();
  const uniqueUrls = [...new Set(allUrls)];
  
  console.log(`[Scraper] Scrape run complete. Found ${uniqueUrls.length} total unique links.`);
  return uniqueUrls;
}
