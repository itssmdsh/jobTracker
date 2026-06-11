import React, { useState } from 'react';
import type { AppSettings } from '../types';
import { Plus, Trash2, Settings, Loader2 } from 'lucide-react';

interface SetupWizardProps {
  initialSettings: AppSettings;
  onComplete: (settings: AppSettings) => Promise<void>;
}

export default function SetupWizard({ initialSettings, onComplete }: SetupWizardProps) {
  const [channels, setChannels] = useState<string[]>(initialSettings.channels);
  const [newChannel, setNewChannel] = useState('');
  const [autoMark, setAutoMark] = useState<'Yes' | 'No'>(initialSettings.auto_mark);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newChannel.trim();
    if (!trimmed) return;
    
    try {
      new URL(trimmed);
    } catch (_) {
      if (!trimmed.startsWith('@')) {
        setError('Please enter a valid URL (e.g. https://youtube.com/...) or channel handle (e.g. @channel)');
        return;
      }
    }

    if (channels.includes(trimmed)) {
      setError('This channel/URL is already in the list.');
      return;
    }

    setChannels([...channels, trimmed]);
    setNewChannel('');
    setError('');
  };

  const handleRemoveChannel = (index: number) => {
    setChannels(channels.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channels.length === 0) {
      setError('Please configure at least one channel or URL to monitor.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onComplete({
        channels,
        frequency: 'Manual',
        daily_time: '',
        auto_mark: autoMark,
        setup_completed: 'true',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <div className="w-full max-w-2xl glass-panel glow-indigo rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="flex items-center gap-3 mb-6 relative">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Settings className="w-8 h-8 animate-spin-slow" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              Apply Tracker
            </h1>
            <p className="text-slate-400 text-sm">First-Time Setup Wizard</p>
          </div>
        </div>

        <p className="text-slate-300 text-sm mb-8 leading-relaxed">
          Welcome! Let's configure the channels you want to monitor and your preferences to start collecting opportunity links on-demand.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500/20 text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 relative">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              1. Which YouTube channels or Website sources should be monitored?
            </label>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Add channel links (e.g. <code className="text-indigo-300">https://youtube.com/@OnlineStudy4u</code>), custom channel handles, or custom websites (e.g. <code className="text-indigo-300">https://jobcode.in/</code>).
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter channel URL or handle..."
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                className="flex-1 glass-input rounded-xl px-4 py-3 text-sm text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddChannel}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-3 flex items-center gap-2 text-sm font-semibold transition-all duration-200 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="glass-input rounded-xl max-h-48 overflow-y-auto p-2 space-y-1">
              {channels.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">No sources added yet.</p>
              ) : (
                channels.map((chan, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/40 text-xs">
                    <span className="text-slate-300 truncate max-w-[85%]">{chan}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChannel(idx)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div>
              <label className="block text-sm font-semibold text-slate-200">
                2. Automatically mark links as Applied when opened?
              </label>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                If enabled, clicking a link will immediately change its status to "Applied". If disabled, you can manually mark it or confirm status.
              </p>
            </div>
            <div className="flex gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              {['Yes', 'No'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAutoMark(val as 'Yes' | 'No')}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 ${
                    autoMark === val
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-indigo-600/25 transition-all duration-300 hover:shadow-indigo-600/35 flex items-center justify-center gap-2 border border-indigo-400/20 disabled:opacity-50 active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving Settings...
              </>
            ) : (
              'Save and Start Tracking'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
