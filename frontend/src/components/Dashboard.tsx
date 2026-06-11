import { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import Modal from './Modal';
import SettingsPane from './SettingsPane';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

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
        setAllLinks(JSON.parse(stored));
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
            currentLinks = JSON.parse(existingStored);
          } catch (e) {
            console.error(e);
          }
        }

        const existingUrls = new Set(currentLinks.map(l => l.url));
        let addedCount = 0;
        const newLinks: ScrapedLink[] = [];
        
        let nextId = currentLinks.reduce((max, l) => l.id > max ? l.id : max, 0) + 1;
        
        for (const url of data.links) {
          if (!existingUrls.has(url)) {
            newLinks.push({
              id: nextId++,
              url,
              status: 'Pending',
              created_at: new Date().toISOString()
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
                  filteredLinks.map((link, index) => (
                    <tr key={link.id} className="hover:bg-slate-900/30 transition-all duration-150 group">
                      <td className="py-4 px-6 text-sm max-w-xs sm:max-w-md md:max-w-xl">
                        <div className="flex items-center gap-3 font-medium">
                          <span className="text-slate-500 font-mono text-xs w-6 text-right flex-shrink-0">
                            {index + 1}.
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
