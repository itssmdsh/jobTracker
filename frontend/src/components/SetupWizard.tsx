import React, { useState } from 'react';
import type { AppSettings } from '../types';
import { Plus, Trash2, Settings, Loader2, User, Globe, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface SetupWizardProps {
  initialSettings: AppSettings;
  onComplete: (settings: AppSettings) => Promise<void>;
}

export default function SetupWizard({ initialSettings, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1: Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [yop, setYop] = useState('2026'); // default year of passing
  const [techStack, setTechStack] = useState('');

  // Step 2: Sources State
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

  const validateStep1 = () => {
    if (!name.trim()) return 'Name is required.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'A valid email is required.';
    if (!college.trim()) return 'College name is required.';
    if (!branch.trim()) return 'Branch of study is required.';
    if (!yop.trim()) return 'Year of passing is required.';
    if (!techStack.trim()) return 'Tech stack is required.';
    return '';
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(2);
  };

  const submitToGoogleForm = async (profile: {
    name: string;
    email: string;
    college: string;
    branch: string;
    yop: string;
    tech_stack: string;
  }) => {
    const formUrl = import.meta.env.VITE_GOOGLE_FORM_URL;
    if (!formUrl) {
      console.warn('[Google Form Integration] VITE_GOOGLE_FORM_URL is not set. Data will only be saved locally.');
      return;
    }

    const formData = new URLSearchParams();
    formData.append(import.meta.env.VITE_GOOGLE_FORM_NAME_ENTRY || 'entry.name', profile.name);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_EMAIL_ENTRY || 'entry.email', profile.email);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_COLLEGE_ENTRY || 'entry.college', profile.college);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_BRANCH_ENTRY || 'entry.branch', profile.branch);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_YOP_ENTRY || 'entry.yop', profile.yop);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_TECHSTACK_ENTRY || 'entry.techstack', profile.tech_stack);

    try {
      await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      console.log('[Google Form Integration] Form submitted successfully.');
    } catch (err) {
      console.error('[Google Form Integration] Failed to submit form:', err);
      // We log but don't block the user's setup if it is a network error (e.g. CORS block/no-cors opaque fallback is fine)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final check
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      setStep(1);
      return;
    }

    if (channels.length === 0) {
      setError('Please configure at least one channel or URL to monitor.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const profileData = {
        name: name.trim(),
        email: email.trim(),
        college: college.trim(),
        branch: branch.trim(),
        yop,
        tech_stack: techStack.trim(),
      };

      // Submit to Google Form (runs asynchronously, ignores opaque response)
      await submitToGoogleForm(profileData);

      // Save to local storage
      await onComplete({
        channels,
        frequency: 'Manual',
        daily_time: '',
        auto_mark: autoMark,
        setup_completed: 'true',
        profile: profileData,
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

        {/* Wizard Header */}
        <div className="flex items-center gap-3 mb-8 relative">
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

        {/* Steps Progress Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1 ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20' : 'bg-indigo-950 text-indigo-300'}`}>
              1
            </span>
            <span className={`text-sm font-semibold transition-all ${step === 1 ? 'text-slate-100' : 'text-slate-500'}`}>
              Student Profile
            </span>
          </div>
          <div className="h-[1px] flex-1 mx-4 bg-slate-800"></div>
          <div className="flex items-center gap-2.5">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2 ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20' : 'bg-indigo-950 text-indigo-300'}`}>
              2
            </span>
            <span className={`text-sm font-semibold transition-all ${step === 2 ? 'text-slate-100' : 'text-slate-500'}`}>
              Sources & Options
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500/20 text-red-200 rounded-lg text-sm transition-all duration-200">
            {error}
          </div>
        )}

        {/* Multi-Step Form */}
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          {/* STEP 1: Student Profile Form */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-indigo-400" /> Enter Your Profile Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  College Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your college/university name..."
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Branch / Specialization
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science..."
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Year of Passing
                  </label>
                  <select
                    value={yop}
                    onChange={(e) => setYop(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-300 bg-slate-950 cursor-pointer focus:border-indigo-500 transition-colors outline-none"
                    title="Select Year of Passing"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(yr => (
                      <option key={yr} value={yr} className="bg-slate-950 text-slate-200">{yr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Tech Stack
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Node.js, TypeScript, Python..."
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                Next: Sources & Options <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Sources Setup Form */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" /> Configure Monitor Settings
              </h2>
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  1. Which YouTube channels or website sources should be monitored?
                </label>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  Enter channel URLs (e.g. <code className="text-indigo-300">https://youtube.com/@OnlineStudy4u</code>), handles, or custom websites (e.g. <code className="text-indigo-300">https://jobcode.in/</code>).
                </p>

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
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="glass-input rounded-xl max-h-40 overflow-y-auto p-2 space-y-1">
                  {channels.length === 0 ? (
                    <p className="text-slate-500 text-xs py-4 text-center">No sources added yet.</p>
                  ) : (
                    channels.map((chan, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/40 text-[11px]">
                        <span className="text-slate-300 truncate max-w-[85%]">{chan}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChannel(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="max-w-md">
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    2. Automatically mark links as Applied when opened?
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    When enabled, clicking a link will automatically mark it as "Applied". When disabled, you'll be prompted to mark it manually.
                  </p>
                </div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {['Yes', 'No'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAutoMark(val as 'Yes' | 'No')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
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

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl py-3 border border-slate-800 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl py-3 font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 border border-indigo-400/20 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save and Start Tracking
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
