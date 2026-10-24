import React, { useState } from 'react';
import { X, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function CorrectionModal({ question, onClose, onSuccess }) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!question) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 text-center space-y-4 border border-cyan-400/30">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Sign In Required</h3>
          <p className="text-xs text-slate-300">
            You must be signed in with your verified NSTU EduMail to request corrections or propose replacement files.
          </p>
          <Link
            to="/login"
            onClick={onClose}
            className="inline-block w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold"
          >
            Sign In with EduMail
          </Link>
        </div>
      </div>
    );
  }

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
          <p className="font-semibold text-cyan-300">Important Policy (BR-04 & BR-12):</p>
          <p>
            The live question paper remains published and unchanged while your proposed correction is reviewed by the
            department administrator.
          </p>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Explanation of Error / Discrepancy *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Page 2 is blurry or missing questions 4 and 5; or incorrect semester tagged..."
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
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
