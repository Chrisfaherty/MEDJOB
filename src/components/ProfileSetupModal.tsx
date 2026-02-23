'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, GraduationCap, X, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GRADE_OPTIONS = [
  { value: 'INTERN',              label: 'Intern' },
  { value: 'SHO',                 label: 'Senior House Officer (SHO)' },
  { value: 'REGISTRAR',           label: 'Registrar' },
  { value: 'SPECIALIST_REGISTRAR', label: 'Specialist Registrar (SpR)' },
];

export default function ProfileSetupModal({ isOpen, onClose }: ProfileSetupModalProps) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [grade, setGrade] = useState(user?.currentGrade || '');
  const [centile, setCentile] = useState<string>(user?.centile?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const centileNum = centile ? parseInt(centile, 10) : undefined;
    if (centileNum !== undefined && (centileNum < 1 || centileNum > 100)) {
      setError('Centile must be between 1 and 100');
      return;
    }
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateProfile({
        name: name.trim(),
        centile: centileNum,
        current_grade: grade || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center mb-3">
                      <User className="w-5 h-5 text-teal" />
                    </div>
                    <h2 className="text-lg font-bold text-apple-black">Complete Your Profile</h2>
                    <p className="text-[13px] text-apple-secondary mt-0.5">
                      Set your grade and centile to unlock match ratings for every job
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[12px] font-semibold text-apple-black mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Dr. Your Name"
                    className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all"
                  />
                </div>

                {/* Current Grade */}
                <div>
                  <label className="block text-[12px] font-semibold text-apple-black mb-1.5">
                    <GraduationCap className="w-3.5 h-3.5 inline mr-1 text-teal" />
                    Current Grade
                  </label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all bg-white"
                  >
                    <option value="">Select your current grade…</option>
                    {GRADE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Centile */}
                <div>
                  <label className="block text-[12px] font-semibold text-apple-black mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1 text-teal" />
                    HSE Centile Score
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={centile}
                      onChange={e => setCentile(e.target.value)}
                      placeholder="e.g. 72"
                      className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all pr-14"
                    />
                    {centile && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-teal">
                        {centile}th
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-apple-secondary mt-1">
                    Your HSE ranking percentile — shown on your NCHD exam results letter
                  </p>
                </div>

                {error && (
                  <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex items-center justify-between gap-3">
                <button
                  onClick={onClose}
                  className="text-[12px] text-apple-secondary hover:text-slate-700 font-medium transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-teal text-white text-[13px] font-semibold rounded-xl hover:bg-teal/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
