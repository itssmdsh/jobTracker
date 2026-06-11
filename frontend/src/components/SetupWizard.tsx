import React, { useState } from 'react';
import type { AppSettings } from '../types';
import { Loader2, User, BookOpen, HelpCircle, ShieldCheck } from 'lucide-react';

interface SetupWizardProps {
  initialSettings: AppSettings;
  onComplete: (settings: AppSettings) => Promise<void>;
}

export default function SetupWizard({ initialSettings, onComplete }: SetupWizardProps) {
  // Profile Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [yop, setYop] = useState('');
  const [techStack, setTechStack] = useState('');
  const [discovery, setDiscovery] = useState('');
  const [discoveryOther, setDiscoveryOther] = useState('');
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitToGoogleForm = async (profile: {
    name: string;
    email: string;
    college: string;
    degree: string;
    branch: string;
    yop: string;
    tech_stack: string;
    discovery: string;
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
    formData.append(import.meta.env.VITE_GOOGLE_FORM_DEGREE_ENTRY || 'entry.degree', profile.degree);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_BRANCH_ENTRY || 'entry.branch', profile.branch);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_YOP_ENTRY || 'entry.yop', profile.yop);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_TECHSTACK_ENTRY || 'entry.techstack', profile.tech_stack);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_DISCOVERY_ENTRY || 'entry.discovery', profile.discovery);
    formData.append(import.meta.env.VITE_GOOGLE_FORM_CONFIRMATION_ENTRY || 'entry.confirmation', 'I Agree');

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!name.trim()) return setError('Full Name is required.');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return setError('A valid Email Address is required.');
    if (!college.trim()) return setError('College / University Name is required.');
    if (!degree.trim()) return setError('Degree Program is required.');
    if (!branch.trim()) return setError('Branch / Specialization is required.');
    if (!yop) return setError('Year of Passing (YOP) is required.');
    if (!techStack.trim()) return setError('Primary Tech Stack is required.');
    if (!discovery) return setError('Please specify how you discovered Apply Tracker.');
    if (discovery === 'Other' && !discoveryOther.trim()) return setError('Please specify details for "Other".');
    if (!agree) return setError('You must agree and consent to proceed.');

    setLoading(true);
    setError('');

    try {
      const discoveryValue = discovery === 'Other' ? `Other: ${discoveryOther.trim()}` : discovery;
      
      const profileData = {
        name: name.trim(),
        email: email.trim(),
        college: college.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        yop,
        tech_stack: techStack.trim(),
        discovery: discoveryValue,
        consent: agree,
      };

      // Submit to Google Form asynchronously
      await submitToGoogleForm(profileData);

      // Onboard the user with all default channels
      await onComplete({
        channels: initialSettings.channels, // default channels list
        frequency: 'Manual',
        daily_time: '',
        auto_mark: initialSettings.auto_mark,
        setup_completed: 'true',
        profile: profileData,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Main Form Bounding Box */}
        <div className="glass-panel rounded-2xl border-t-[8px] border-t-indigo-600 border-x border-b border-slate-800/60 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
              Apply Tracker User Registration Form
            </h1>
            <div className="h-[1px] w-full bg-slate-800/80" />
            <div className="space-y-3 text-slate-200 text-base leading-relaxed font-semibold">
              <p className="italic text-slate-400">Thank you for using Apply Tracker.</p>
              <p className="text-slate-200">
                This form helps us understand who is using the platform and which colleges, branches, and technology stacks are represented among our users. The information collected will be used only for platform analytics and improvement.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-500/20 text-red-200 rounded-xl text-base font-bold animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: Personal Information */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 p-6 md:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <User className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="text-xl font-extrabold text-slate-100 tracking-wide">Personal Information</h2>
                <span className="text-xs text-slate-400 italic">Description (optional)</span>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-base font-extrabold text-slate-100 mb-2.5">
                  Full Name : <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your answer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input rounded-xl px-5 py-3 text-base font-semibold text-white placeholder-slate-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-base font-extrabold text-slate-100 mb-2.5">
                  Email Address : <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Your answer"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input rounded-xl px-5 py-3 text-base font-semibold text-white placeholder-slate-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Academic Information */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 p-6 md:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="text-xl font-extrabold text-slate-100 tracking-wide">Academic Information</h2>
                <span className="text-xs text-slate-400 italic">Description (optional)</span>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-base font-extrabold text-slate-100 mb-2.5">
                  College / University Name : <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your answer"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full glass-input rounded-xl px-5 py-3 text-base font-semibold text-white placeholder-slate-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-base font-extrabold text-slate-100 mb-2.5">
                  Degree Program : <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your answer (e.g. B.Tech, MCA, BCA)"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full glass-input rounded-xl px-5 py-3 text-base font-semibold text-white placeholder-slate-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-base font-extrabold text-slate-100 mb-2.5">
                  Branch / Specialization : <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your answer (e.g. Computer Science, Information Technology)"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full glass-input rounded-xl px-5 py-3 text-base font-semibold text-white placeholder-slate-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-base font-extrabold text-slate-100 mb-2.5">
                  Year of Passing (YOP) : <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  required
                  value={yop}
                  onChange={(e) => setYop(e.target.value)}
                  className="w-full glass-input rounded-xl px-5 py-3 text-base font-semibold text-white bg-slate-950 cursor-pointer outline-none focus:border-indigo-500 transition-colors"
                  title="Select Year of Passing"
                >
                  <option value="" disabled className="text-slate-500 font-semibold bg-slate-950">Choose year</option>
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                    <option key={year} value={year} className="bg-slate-950 text-slate-200 font-semibold">{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-extrabold text-slate-100 mb-2.5">
                  Primary Tech Stack : <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your answer (e.g. React, Node.js, Python)"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full glass-input rounded-xl px-5 py-3 text-base font-semibold text-white placeholder-slate-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Discovery Source */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 p-6 md:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-slate-100 tracking-wide">
                How did you discover Apply Tracker? : <span className="text-red-500 font-bold">*</span>
              </h2>
            </div>

            <div className="space-y-4">
              {['Friend / Referral', 'WhatsApp', 'Telegram', 'YouTube', 'LinkedIn', 'Other'].map((option) => (
                <label key={option} className="flex items-center gap-3.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="discovery"
                    required
                    value={option}
                    checked={discovery === option}
                    onChange={(e) => setDiscovery(e.target.value)}
                    className="w-5 h-5 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-950 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-base font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">
                    {option}
                  </span>
                </label>
              ))}

              {discovery === 'Other' && (
                <div className="pl-8 mt-2 animate-fade-in">
                  <input
                    type="text"
                    required
                    placeholder="Please specify..."
                    value={discoveryOther}
                    onChange={(e) => setDiscoveryOther(e.target.value)}
                    className="w-full glass-input rounded-xl px-5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Confirmation Consent */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 p-6 md:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-slate-100 tracking-wide">Confirmation <span className="text-red-500 font-bold">*</span></h2>
            </div>

            <div className="space-y-4">
              <p className="text-base text-slate-200 leading-relaxed font-semibold">
                I consent to providing this information for platform analytics and improvement purposes.
              </p>
              <label className="flex items-center gap-3.5 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500 focus:ring-offset-slate-950 focus:ring-2 cursor-pointer"
                />
                <span className="text-base font-extrabold text-white transition-colors">
                  I Agree
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl py-4 text-base font-black tracking-wider shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 border border-indigo-400/20 disabled:opacity-50 cursor-pointer active:scale-98 relative z-10"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" /> Registering & Loading App...
              </>
            ) : (
              'Register & Start Tracking'
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
