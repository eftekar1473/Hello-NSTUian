import React from 'react';
import { X, Download, FileText, Calendar, User, History, Layers } from 'lucide-react';
import { getDownloadUrl } from '../services/api';

export default function QuestionViewerModal({ question, onClose }) {
  if (!question) return null;

  const latestVersion = question.versions?.[0];
  const downloadUrl = getDownloadUrl(question.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-3xl border border-cyan-400/30 shadow-2xl flex flex-col overflow-hidden bg-[#091124]/95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyan-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                {question.course?.course_code || 'COURSE'}
              </span>
              <span className="text-xs text-slate-400">
                Exam Year: {question.exam_session?.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {question.title || `${question.course?.course_title} - ${question.exam_type?.name}`}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-semibold text-white shadow-glass-glow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview & Details Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Preview Frame */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 overflow-hidden bg-black/40 min-h-[380px] flex items-center justify-center relative">
            <iframe
              src={downloadUrl}
              title="Question Paper Preview"
              className="w-full h-full min-h-[450px] border-none"
            />
          </div>

          {/* Metadata Sidebar */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl glass-card space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Academic Metadata
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Department:</span>
                  <p className="font-medium text-white">{question.department?.name}</p>
                </div>

                <div>
                  <span className="text-slate-400">Course:</span>
                  <p className="font-medium text-white">
                    {question.course?.course_code} - {question.course?.course_title}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">Examination Category:</span>
                  <p className="font-medium text-white">
                    {question.exam_type?.name}{' '}
                    {question.ct_number ? `(CT-${question.ct_number} Set ${question.set_name || 'Standard'})` : ''}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">Examination Year:</span>
                  <p className="font-medium text-white">{question.exam_session?.label}</p>
                </div>

                {latestVersion && (
                  <div>
                    <span className="text-slate-400">Original Filename:</span>
                    <p className="font-mono text-cyan-300 truncate">{latestVersion.original_filename}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Version History */}
            <div className="p-4 rounded-2xl glass-card space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Version History</span>
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {question.versions?.map((v) => (
                  <div key={v.id} className="p-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>Version {v.version_number}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {v.change_summary || 'Official verified release'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
