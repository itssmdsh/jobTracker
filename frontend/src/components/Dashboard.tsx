import { useState, useEffect, Fragment } from 'react';
import type { AppSettings, ScrapedLink } from '../types';
import { 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Settings as SettingsIcon,
  Loader2,
  Globe,
  Trash2,
  Mail
} from 'lucide-react';
import Modal from './Modal';
import SettingsPane from './SettingsPane';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

const MOTIVATIONAL_QUOTES = [
  "You miss 100% of the shots you don't take. — Wayne Gretzky",
  "Nothing changes if nothing changes.",
  "Doing the thing is doing the thing.",
  "Time cannot be recovered.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Action is the foundational key to all success. — Pablo Picasso",
  "Focus on being productive instead of busy. — Tim Ferriss",
  "If you want something you've never had, you must be willing to do something you've never done.",
  "Your time is limited, so don't waste it living someone else's life. — Steve Jobs",
  "The secret of getting ahead is getting started. — Mark Twain",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Opportunities don't happen, you create them. — Chris Grosser",
  "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
  "Don't count the days, make the days count. — Muhammad Ali",
  "Consistency is what transforms average into excellence.",
  "Do something today that your future self will thank you for.",
  "The only limit to our realization of tomorrow will be our doubts of today. — Franklin D. Roosevelt",
  "Don't wait. The time will never be just right. — Napoleon Hill",
  "Hustle beats talent when talent doesn't hustle.",
  "Great things are done by a series of small things brought together. — Vincent Van Gogh",
  "Make each day your masterpiece. — John Wooden",
  "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
  "A year from now you may wish you had started today. — Karen Lamb",
  "Stop talking. Start doing.",
  "Dream big. Start small. Act now.",
  "One day or day one. You decide.",
  "The path to success is to take massive, determined action. — Tony Robbins",
  "Do not wait for extraordinary circumstances to do good; try to use ordinary situations. — Charles Richter",
  "Procrastination is the thief of time. — Edward Young",
  "Do the hard jobs first. The easy jobs will take care of themselves. — Dale Carnegie",
  "I attribute my success to this: I never gave or took any excuse. — Florence Nightingale",
  "Yesterday you said tomorrow. Just do it.",
  "You can have results or excuses. Not both.",
  "Energy and persistence conquer all things. — Benjamin Franklin",
  "Action speaks louder than intention.",
  "Efficiency is doing things right; effectiveness is doing the right things. — Peter Drucker",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "Well begun is half done. — Aristotle",
  "Either you run the day, or the day runs you. — Jim Rohn",
  "It is not enough to aim, you must hit. — Italian Proverb",
  "Small daily improvements over time lead to stunning results. — Robin Sharma",
  "Act as if what you do makes a difference. It does. — William James",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work. — Stephen King",
  "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you. — Steve Jobs",
  "You are what you repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle",
  "Definiteness of purpose is the starting point of all achievement. — W. Clement Stone",
  "The best way to predict your future is to create it. — Abraham Lincoln",
  "Success is nothing more than a few simple disciplines, practiced every day. — Jim Rohn",
  "Do not let what you cannot do interfere with what you can do. — John Wooden",
  "Your life does not get better by chance, it gets better by change."
];

const getRandomQuote = () => {
  const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[idx];
};

const getCleanSourceName = (source: string | undefined, url: string): string => {
  const urlToParse = source && source !== 'Other/Unknown' ? source : url;

  if (!urlToParse) return 'Other/Unknown';

  let rawName = 'Other/Unknown';

  try {
    const parsed = new URL(urlToParse);
    const host = parsed.hostname.toLowerCase().replace('www.', '');

    // YouTube channels
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const handleMatch = parsed.pathname.match(/\/@([a-zA-Z0-9._-]+)/);
      if (handleMatch) {
        rawName = handleMatch[1];
      } else {
        const channelMatch = parsed.pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
        if (channelMatch) {
          if (channelMatch[1] === 'UCcyogDO_BD5HS7YlySkTELQ') {
            rawName = 'Online Learning';
          } else {
            rawName = `YouTube (${channelMatch[1].substring(0, 8)})`;
          }
        } else {
          const pathParts = parsed.pathname.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart !== 'watch' && lastPart !== 'videos') {
              rawName = lastPart;
            } else {
              rawName = 'YouTube';
            }
          } else {
            rawName = 'YouTube';
          }
        }
      }
    }
    // Telegram channels
    else if (host.includes('t.me') || host.includes('telegram.me') || host.includes('telegram.dog')) {
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        rawName = pathParts[0];
      } else {
        rawName = 'Telegram';
      }
    }
    // Google Forms
    else if (host === 'docs.google.com' && parsed.pathname.includes('/forms/')) {
      rawName = 'Google Forms';
    }
    // General domains
    else {
      rawName = host;
    }
  } catch (e) {
    if (urlToParse.startsWith('http://') || urlToParse.startsWith('https://')) {
      const parts = urlToParse.split('/');
      if (parts.length > 2) {
        rawName = parts[2].replace('www.', '');
      }
    } else {
      rawName = urlToParse || 'Other/Unknown';
    }
  }

  // Normalize / Map clean names
  const lowerName = rawName.toLowerCase();
  
  if (lowerName.includes('onlinestudy4u')) {
    return 'Online Study 4 U';
  }
  if (lowerName.includes('hiremeplz')) {
    return 'Hire Me Plz';
  }
  if (lowerName.includes('placementlelo')) {
    return 'Placement Lelo';
  }
  if (lowerName.includes('freshershunt')) {
    return 'Freshers Hunt';
  }
  if (lowerName.includes('studentsinternships')) {
    return 'Students Internships';
  }
  if (lowerName.includes('jobs_and_internships_updates')) {
    return 'Jobs & Internships Updates';
  }
  if (lowerName.includes('offcampussdrive') || lowerName.includes('offcampusdrive')) {
    return 'Off Campus Drive';
  }
  if (lowerName.includes('jobcode')) {
    return 'JobCode';
  }
  if (lowerName.includes('freshergo')) {
    return 'FresherGo';
  }
  
  if (rawName.includes('.')) {
    return rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }

  return rawName;
};



interface DashboardProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
}

export default function Dashboard({ settings, onUpdateSettings }: DashboardProps) {
  const [allLinks, setAllLinks] = useState<ScrapedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Applied'>('All');
  const [scrapeTimeframe, setScrapeTimeframe] = useState('24h');
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote);

  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(() => {
    return localStorage.getItem('apply_tracker_feedback_submitted') === 'true';
  });
  const [feedbackSnoozed, setFeedbackSnoozed] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  
  const [promptOpen, setPromptOpen] = useState(false);
  const [pendingLinkToMark, setPendingLinkToMark] = useState<ScrapedLink | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [onPasswordSuccess, setOnPasswordSuccess] = useState<() => void>(() => {});

  const handleOpenSettings = () => {
    setPasswordInput('');
    setPasswordError('');
    setOnPasswordSuccess(() => () => setSettingsOpen(true));
    setPasswordOpen(true);
  };

  // Load links from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('apply_tracker_links');
      if (stored) {
        const parsed: ScrapedLink[] = JSON.parse(stored);
        
        // Exclude spam links dynamically to clean up any old local storage items
        const cleaned = parsed.filter(link => {
          try {
            const host = new URL(link.url).hostname.toLowerCase();
            if (
              host.includes('atsbasedresume.com') ||
              host.includes('courses.store') ||
              host.includes('topmate.io') ||
              host.includes('drive.google.com') ||
              host.includes('leetcode.com') ||
              host.includes('youtube.com') || 
              host.includes('youtu.be') ||
              host.includes('whatsapp.com') ||
              host.includes('wa.me') ||
              host.includes('t.me') ||
              host.includes('telegram.me') ||
              host.includes('telegram.dog') ||
              host.includes('telegram.org') ||
              ['facebook.com', 'fb.me', 'twitter.com', 'x.com', 'instagram.com', 'instagr.am', 'linkedin.com', 'pinterest.com', 'reddit.com'].some(d => host.includes(d))
            ) {
              return false;
            }
            return true;
          } catch (e) {
            return false;
          }
        }).map(link => {
          // Backward compatibility: ensure source field exists
          if (!link.source) {
            return { ...link, source: 'Other/Unknown' };
          }
          return link;
        });
        
        if (cleaned.length !== parsed.length || parsed.some(p => !p.source)) {
          localStorage.setItem('apply_tracker_links', JSON.stringify(cleaned));
        }
        
        setAllLinks(cleaned);
      }
    } catch (e) {
      console.error('Failed to parse links from localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute counts
  const totalCount = allLinks.length;
  const pendingCount = allLinks.filter(l => l.status === 'Pending').length;
  const appliedCount = allLinks.filter(l => l.status === 'Applied').length;

  // Filter links in-memory
  const filteredLinks = allLinks.filter(link => {
    // Filter by status
    if (filter === 'Pending' && link.status !== 'Pending') return false;
    if (filter === 'Applied' && link.status !== 'Applied') return false;
    
    // Filter by search
    if (search.trim()) {
      return link.url.toLowerCase().includes(search.trim().toLowerCase());
    }
    
    return true;
  });

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch(`${API_BASE}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: settings.channels,
          timeframe: scrapeTimeframe
        })
      });
      if (!res.ok) throw new Error('Scraping service failed.');
      
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        const existingStored = localStorage.getItem('apply_tracker_links');
        let currentLinks: ScrapedLink[] = [];
        if (existingStored) {
          try {
            currentLinks = JSON.parse(existingStored).map((l: any) => l.source ? l : { ...l, source: 'Other/Unknown' });
          } catch (e) {
            console.error(e);
          }
        }

        const existingUrls = new Set(currentLinks.map(l => l.url));
        let addedCount = 0;
        const newLinks: ScrapedLink[] = [];
        
        let nextId = currentLinks.reduce((max, l) => l.id > max ? l.id : max, 0) + 1;
        
        for (const item of data.links) {
          const url = typeof item === 'string' ? item : item.url;
          const source = typeof item === 'string' ? 'Other/Unknown' : item.source || 'Other/Unknown';

          if (!existingUrls.has(url)) {
            newLinks.push({
              id: nextId++,
              url,
              status: 'Pending',
              created_at: new Date().toISOString(),
              source
            });
            addedCount++;
          }
        }
        
        const updatedLinks = [...newLinks, ...currentLinks];
        localStorage.setItem('apply_tracker_links', JSON.stringify(updatedLinks));
        setAllLinks(updatedLinks);
        
        alert(`Scraping complete! Found ${addedCount} new links.`);
      } else {
        alert('Scraping failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Scraping error:', err);
      alert('Network error during scraping: ' + err.message);
    } finally {
      setScraping(false);
    }
  };

  const handleUpdateStatus = (id: number, status: 'Pending' | 'Applied') => {
    const updated = allLinks.map(l => l.id === id ? { ...l, status } : l);
    setAllLinks(updated);
    localStorage.setItem('apply_tracker_links', JSON.stringify(updated));
  };

  const handleDeleteLink = (id: number) => {
    const updated = allLinks.filter(l => l.id !== id);
    setAllLinks(updated);
    localStorage.setItem('apply_tracker_links', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all links? This will reset your dashboard.")) {
      setAllLinks([]);
      localStorage.removeItem('apply_tracker_links');
    }
  };

  const handleRefresh = () => {
    setCurrentQuote(getRandomQuote());
    setLoading(true);
    try {
      const stored = localStorage.getItem('apply_tracker_links');
      if (stored) {
        setAllLinks(JSON.parse(stored));
      } else {
        setAllLinks([]);
      }
    } catch (e) {
      console.error('Failed to parse links from localStorage', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (link: ScrapedLink) => {
    window.open(link.url, '_blank', 'noopener,noreferrer');

    if (settings.auto_mark === 'Yes') {
      if (link.status === 'Pending') {
        handleUpdateStatus(link.id, 'Applied');
      }
    } else {
      if (link.status === 'Pending') {
        setPendingLinkToMark(link);
        setPromptOpen(true);
      }
    }
  };

  const handleConfirmAutoMark = () => {
    if (pendingLinkToMark) {
      handleUpdateStatus(pendingLinkToMark.id, 'Applied');
    }
    setPromptOpen(false);
    setPendingLinkToMark(null);
  };

  const handleCancelAutoMark = () => {
    setPromptOpen(false);
    setPendingLinkToMark(null);
  };

  // Group filtered links by source
  const groupedLinks: { [source: string]: ScrapedLink[] } = {};
  filteredLinks.forEach(link => {
    const src = getCleanSourceName(link.source, link.url);
    if (!groupedLinks[src]) {
      groupedLinks[src] = [];
    }
    groupedLinks[src].push(link);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {currentQuote && (
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/60 text-center relative overflow-hidden bg-slate-900/20 glow-indigo animate-fade-in flex flex-col justify-center items-center gap-2">
            <div className="absolute top-2 left-4 text-slate-700/30 text-5xl font-serif select-none">“</div>
            <p className="text-slate-100 text-xl md:text-2xl italic font-semibold relative z-10 leading-relaxed px-6">
              "{currentQuote}"
            </p>
            <div className="absolute bottom-2 right-4 text-slate-700/30 text-5xl font-serif select-none">”</div>
          </div>
        )}

        {appliedCount >= 20 && !feedbackSubmitted && !feedbackSnoozed && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 relative overflow-hidden bg-slate-900/40 glow-indigo animate-fade-in flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-100 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                Congratulations on {appliedCount} Applications! 🎉
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                You've successfully marked {appliedCount} opportunities as Applied. We would love to get your feedback and rating on our service!
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <svg
                      className={`w-8 h-8 ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-amber-300'}`}
                      fill={rating >= star ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.9 1.549-.9 1.84 0l1.817 5.597a1 1 0 00.95.69h5.89c.961 0 1.36 1.252.583 1.812l-4.764 3.461a1 1 0 00-.364 1.118l1.817 5.597c.3.9-.755 1.688-1.54 1.118l-4.764-3.461a1 1 0 00-1.18 0l-4.764 3.461c-.785.57-1.84-.219-1.54-1.118l1.817-5.597a1 1 0 00-.364-1.118L2.25 11.026c-.78-.56-.38-1.812.583-1.812h5.89a1 1 0 00.95-.69L11.05 2.928z"
                      />
                    </svg>
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <div className="w-full md:w-80 flex flex-col gap-2 animate-fade-in mt-1">
                  <textarea
                    placeholder="Tell us what you like or how we can improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200 h-16 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setFeedbackSnoozed(true)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg transition-all border border-slate-800 cursor-pointer"
                    >
                      Snooze
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('apply_tracker_feedback_submitted', 'true');
                        setFeedbackSubmitted(true);
                        const subject = encodeURIComponent(`Apply Tracker Rating - ${rating} Stars`);
                        const body = encodeURIComponent(`Rating: ${rating}/5 Stars\n\nComment: ${comment || 'No comment'}`);
                        window.location.href = `mailto:itssmdsh@gmail.com?subject=${subject}&body=${body}`;
                      }}
                      className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-white shadow transition-all active:scale-95 cursor-pointer"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 glass-panel">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              Apply Tracker Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoring {settings.channels.length} sources • Local Storage Mode
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={scrapeTimeframe}
              onChange={(e) => setScrapeTimeframe(e.target.value)}
              className="glass-input rounded-xl px-3 py-3 text-xs text-slate-300 font-semibold bg-slate-900/80 border border-slate-800 cursor-pointer outline-none transition-all focus:border-indigo-500"
              title="Scrape timeframe filter"
            >
              <option value="24h" className="bg-slate-950 text-slate-200">Last 24 Hours</option>
              <option value="48h" className="bg-slate-950 text-slate-200">Last 2 Days</option>
              <option value="72h" className="bg-slate-950 text-slate-200">Last 3 Days</option>
              <option value="1w" className="bg-slate-950 text-slate-200">Last Week</option>
              <option value="all" className="bg-slate-950 text-slate-200">All Recent</option>
            </select>
            <button
              onClick={handleOpenSettings}
              className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-all duration-200 flex items-center justify-center"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 animate-spin-slow hover:animate-spin" style={{ animationDuration: '6s' }} />
            </button>
            <a
              href="mailto:itssmdsh@gmail.com?subject=Apply Tracker Feedback"
              className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-all duration-200 flex items-center justify-center animate-fade-in"
              title="Send Feedback"
            >
              <Mail className="w-5 h-5" />
            </a>
            <button
              onClick={handleRefresh}
              className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-all duration-200 flex items-center justify-center"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearAll}
              disabled={totalCount === 0}
              className="bg-slate-900/80 hover:bg-red-950/30 text-slate-400 hover:text-red-400 disabled:opacity-40 font-semibold rounded-xl px-4 py-3 text-xs border border-slate-800 hover:border-red-500/20 transition-all duration-200 active:scale-95"
            >
              Clear All
            </button>
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl px-5 py-3 flex items-center gap-2 text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 active:scale-95 border border-indigo-500/30"
            >
              {scraping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Scraping...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Scrape Now
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 relative overflow-hidden flex items-center justify-between glow-indigo transition-transform duration-300 hover:scale-[1.02]">
            <div>
              <p className="text-slate-400 text-sm font-semibold">Total Opportunities</p>
              <h3 className="text-3xl font-black mt-2 text-slate-100">{totalCount}</h3>
            </div>
            <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
              <Globe className="w-6 h-6" />
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 relative overflow-hidden flex items-center justify-between transition-transform duration-300 hover:scale-[1.02]">
            <div>
              <p className="text-slate-400 text-sm font-semibold">Pending</p>
              <h3 className="text-3xl font-black mt-2 text-amber-400">{pendingCount}</h3>
            </div>
            <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 relative overflow-hidden flex items-center justify-between glow-emerald transition-transform duration-300 hover:scale-[1.02]">
            <div>
              <p className="text-slate-400 text-sm font-semibold">Applied</p>
              <h3 className="text-3xl font-black mt-2 text-emerald-400">{appliedCount}</h3>
            </div>
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-xl border border-slate-800/40">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 self-start md:self-auto">
            {(['All', 'Pending', 'Applied'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  filter === t
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200"
            />
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Link</th>
                  <th className="py-4 px-6 w-32">Status</th>
                  <th className="py-4 px-6 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500 text-sm">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        Loading dashboard...
                      </div>
                    </td>
                  </tr>
                ) : filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500 text-sm">
                      No links found. Try scraping or modifying your filter.
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedLinks).map(([source, sourceLinks]) => (
                    <Fragment key={source}>
                      <tr className="bg-slate-900/60 border-y border-slate-800/80">
                        <td colSpan={3} className="py-2.5 px-6 text-xs font-bold text-indigo-400 uppercase tracking-wider bg-slate-900/40">
                          Source: {source} ({sourceLinks.length} opportunities)
                        </td>
                      </tr>
                      {sourceLinks.map((link) => {
                        const globalIndex = filteredLinks.findIndex(l => l.id === link.id);
                        return (
                          <tr key={link.id} className="hover:bg-slate-900/30 transition-all duration-150 group">
                            <td className="py-4 px-6 text-sm max-w-xs sm:max-w-md md:max-w-xl">
                              <div className="flex items-center gap-3 font-medium">
                                <span className="text-slate-500 font-mono text-xs w-6 text-right flex-shrink-0">
                                  {globalIndex + 1}.
                                </span>
                                <span className="truncate text-slate-300 select-all" title={link.url}>
                                  {link.url}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                                link.status === 'Applied'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                              onClick={() => handleUpdateStatus(link.id, link.status === 'Applied' ? 'Pending' : 'Applied')}
                              title="Click to toggle status"
                              >
                                {link.status === 'Applied' ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Applied
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right w-32">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-all"
                                  title="Delete link"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenLink(link)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all duration-200 shadow shadow-indigo-600/20 active:scale-95"
                                  title="Open Link"
                                >
                                  <span>Open</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={promptOpen}
          title="Mark as Applied?"
          message="Would you like to mark this opportunity link as Applied?"
          onConfirm={handleConfirmAutoMark}
          onCancel={handleCancelAutoMark}
          confirmText="Yes"
          cancelText="No"
        />

        <SettingsPane
          isOpen={settingsOpen}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={onUpdateSettings}
        />

        {passwordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
              onClick={() => setPasswordOpen(false)}
            />
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordInput === 'slowdown') {
                  setPasswordOpen(false);
                  onPasswordSuccess();
                } else {
                  setPasswordError('Incorrect password. Please try again.');
                }
              }}
              className="w-full max-w-sm glass-panel rounded-2xl p-6 shadow-2xl relative z-10 border border-slate-800 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <SettingsIcon className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Password Required</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Please enter the password to customize the channels and application settings.
                </p>
                
                <input
                  type="password"
                  placeholder="Enter password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-center text-slate-200"
                  autoFocus
                />
                
                {passwordError && (
                  <p className="text-red-400 text-xs font-semibold">{passwordError}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setPasswordOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        )}
        
      </div>
    </div>
  );
}
