import React, { useState } from 'react';
import { X, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CorrectionModal({ question, onClose, onSuccess }) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!question) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError('Please provide at least 10 characters explaining what needs correction.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('questionPaperId', question.id);
      formData.append('description', description.trim());
      if (file) {
        formData.append('file', file);
      }
      if (!user) {
        formData.append('contributorName', guestName.trim() || 'NSTU Student');
        formData.append('contributorEmail', guestEmail.trim() || 'student@student.nstu.edu.bd');
      }

      await api.submitCorrection(formData);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to submit correction request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-cyan-400/30 shadow-2xl p-6 bg-[#0a1226]/95">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Request Correction / Propose Replacement</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          For: <span className="text-cyan-300 font-semibold">{question.title || question.course?.course_title}</span>
        </p>

        <div className="mt-4 p-3 rounded-xl bg-blue-950/60 border border-blue-500/20 text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-cyan-300">Open Correction Submission:</p>
          <p>
            Any user can flag errors or upload clearer replacement files. The current live question paper remains available
            while your submission is reviewed by department moderation.
          </p>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!user && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="NSTUian Student"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2 rounded-lg glass-input text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Your Email</label>
                <input
                  type="email"
                  placeholder="roll@student.nstu.edu.bd"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full p-2 rounded-lg glass-input text-white text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Explanation of Error / Discrepancy *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Page 2 is blurry or missing question 3; or incorrect exam year tagged..."
              className="w-full p-3 rounded-xl glass-input text-white text-xs placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Proposed Replacement File (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supported: PDF, PNG, JPG, WebP, DOCX. Max 25MB.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl glass-pill text-xs text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-glass-glow disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Submit Correction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
