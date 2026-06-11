import { useState, useEffect } from 'react';
import type { AppSettings } from './types';
import SetupWizard from './components/SetupWizard';
import Dashboard from './components/Dashboard';

const DEFAULT_SETTINGS: AppSettings = {
  channels: [
    "https://jobcode.in/",
    "https://freshergo.in/",
    "https://www.youtube.com/@OnlineStudy4u",
    "https://www.youtube.com/@hiremeplz",
    "https://www.youtube.com/channel/UCcyogDO_BD5HS7YlySkTELQ",
    "https://telegram.me/PLACEMENTLELO",
    "https://t.me/freshershunt",
    "https://t.me/studentsinternships",
    "https://t.me/jobs_and_internships_updates",
    "https://t.me/offcampussdrive"
  ],
  frequency: "Manual",
  daily_time: "",
  auto_mark: "Yes",
  setup_completed: "false"
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('apply_tracker_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    localStorage.setItem('apply_tracker_settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <p className="text-slate-400 text-sm font-medium">Loading Apply Tracker...</p>
      </div>
    );
  }

  if (settings.setup_completed === 'false') {
    return (
      <SetupWizard
        initialSettings={settings}
        onComplete={handleUpdateSettings}
      />
    );
  }

  return (
    <Dashboard
      settings={settings}
      onUpdateSettings={handleUpdateSettings}
    />
  );
}
