import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import { X, Plus, Trash2, Loader2, Save } from 'lucide-react';

interface SettingsPaneProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => Promise<void>;
}

export default function SettingsPane({ isOpen, settings, onClose, onSave }: SettingsPaneProps) {
  const [channels, setChannels] = useState<string[]>([]);
  const [newChannel, setNewChannel] = useState('');
  const [autoMark, setAutoMark] = useState<'Yes' | 'No'>('Yes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && settings) {
      setChannels(settings.channels);
      setAutoMark(settings.auto_mark);
      setError('');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

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
      await onSave({
        channels,
        frequency: 'Manual',
        daily_time: '',
        auto_mark: autoMark,
        setup_completed: 'true',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="w-full max-w-2xl glass-panel rounded-2xl p-6 shadow-2xl relative z-10 border border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Configure App Settings
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500/20 text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Monitored Channels */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              YouTube channels or Website sources
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Enter channel URL or handle..."
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddChannel}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="glass-input rounded-xl max-h-40 overflow-y-auto p-2 space-y-1">
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

          {/* Auto-mark preference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div>
              <label className="block text-sm font-semibold text-slate-200">
                Auto-mark as Applied when opened?
              </label>
            </div>
            <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {['Yes', 'No'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAutoMark(val as 'Yes' | 'No')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
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

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
