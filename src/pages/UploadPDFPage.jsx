import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Check, Loader2, Sparkles, RefreshCw, BookOpen, Eye, Pencil, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function UploadPDFPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadId, setUploadId] = useState(null);
  const [status, setStatus] = useState(null); // processing | completed | failed
  const [questions, setQuestions] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [creating, setCreating] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedAccessCode, setGeneratedAccessCode] = useState('');
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [editingFileId, setEditingFileId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [savingFileId, setSavingFileId] = useState('');
  const [deletingFileId, setDeletingFileId] = useState('');

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  };

  const formatSize = (bytes) => {
    const size = Number(bytes || 0);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fetchFiles = async () => {
    setFilesLoading(true);
    try {
      const res = await api.get('/files');
      setFiles(Array.isArray(res.data?.files) ? res.data.files : []);
    } catch {
      toast.error('Could not load uploaded files.');
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const sanitizeQuestion = (question, index) => {
    const defaults = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
    const rawOptions = Array.isArray(question?.options) ? question.options : [];
    const options = Array.from({ length: 4 }, (_, i) => {
      const value = rawOptions[i];
      const text = typeof value === 'string' ? value.trim() : '';
      return text || defaults[i];
    });
    let correctIdx = Number.isInteger(question?.correctOptionIndex)
      ? question.correctOptionIndex
      : Number.isInteger(question?.correctAnswer)
      ? question.correctAnswer
      : 0;
    if (correctIdx < 0 || correctIdx > 3) correctIdx = 0;
    return {
      ...question,
      question: (question?.question || '').trim() || `Generated Question ${index + 1}`,
      options,
      correctOptionIndex: correctIdx,
      correctAnswer: correctIdx,
    };
  };

  // ── File selection ────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    if (!(name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt'))) { toast.error('Please select a PDF, DOCX, or TXT file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setSelectedFile(file);
    setQuestions([]);
    setUploadId(null);
    setStatus(null);
    setUploadProgress(0);
    setSelectedIndices([]);
    toast.success('File selected!');
  };

  const handleInputChange = (e) => handleFileSelect(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => e.preventDefault();
  const removeFile = () => {
    setSelectedFile(null);
    setQuestions([]);
    setUploadId(null);
    setStatus(null);
    setUploadProgress(0);
    setGeneratedAccessCode('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Upload PDF ────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please choose a file first');
      return;
    }
    if (uploading) return;
    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadProgress(30);
      const res = await api.post('/pdf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 60) + 30;
          setUploadProgress(Math.min(pct, 90));
        },
      });

      setUploadId(res.data.uploadId);
      setStatus('processing');
      setUploadProgress(100);
      toast.success('File uploaded! Generating questions...');
      fetchFiles();

      // Poll for completion
      pollStatus(res.data.uploadId);
    } catch (err) {
      toast.error('Upload failed. Please check your file and try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Poll status ───────────────────────────────────────
  const pollStatus = (id) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pdf/${id}/status`);
        if (res.data.status === 'completed') {
          clearInterval(interval);
          setStatus('completed');
          setUploading(false);
          fetchQuestions(id);
          toast.success('Questions generated!');
        } else if (res.data.status === 'failed') {
          clearInterval(interval);
          setStatus('failed');
          setUploading(false);
          toast.error('Failed to process file');
        }
      } catch {
        clearInterval(interval);
        setUploading(false);
      }
    }, 2000);
  };

  // ── Fetch generated questions ─────────────────────────
  const fetchQuestions = async (id) => {
    try {
      const res = await api.get(`/pdf/${id}/questions`);
      const safeQuestions = (res.data.questions || []).map((q, i) => sanitizeQuestion(q, i));
      setQuestions(safeQuestions);
      setSelectedIndices(safeQuestions.map((_, i) => i)); // all selected by default
      setQuestionCount(Math.min(5, Math.max(1, safeQuestions.length)));
    } catch {
      toast.error('Failed to load questions');
    }
  };

  // ── Toggle question selection ─────────────────────────
  const toggleQuestion = (idx) => {
    setSelectedIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // ── Create quiz from selected questions ───────────────
  const handleCreateQuiz = async () => {
    if (!quizTitle.trim()) { toast.error('Enter a quiz title'); return; }
    setCreating(true);
    try {
      // Frontend safety net for current screen/testing
      const safeQuestions = questions.map((q, i) => sanitizeQuestion(q, i));
      setQuestions(safeQuestions);
      const indicesToSend = selectedIndices.length > 0
        ? selectedIndices
        : safeQuestions.map((_, i) => i);
      const requestedCount = Number(questionCount);
      if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > indicesToSend.length) {
        toast.error(`Enter a number between 1 and ${indicesToSend.length}`);
        setCreating(false);
        return;
      }
      const res = await api.post(`/pdf/${uploadId}/confirm`, {
        title: quizTitle,
        selectedIndices: indicesToSend,
        questionCount: requestedCount,
      });
      setGeneratedAccessCode(res.data.accessCode || '');
      toast.success(`Quiz saved with ${res.data.questionsCount} questions`);
    } catch (err) {
      toast.error('Failed to create quiz. Please review your selections and try again.');
    } finally {
      setCreating(false);
      setShowConfirm(false);
    }
  };

  const startRename = (file) => {
    setEditingFileId(file.id);
    setEditingName(file.originalName || file.name || '');
  };

  const cancelRename = () => {
    setEditingFileId('');
    setEditingName('');
  };

  const saveRename = async (fileId) => {
    const nextName = editingName.trim();
    if (!nextName) {
      toast.error('Please enter a valid file name.');
      return;
    }
    setSavingFileId(fileId);
    try {
      await api.put(`/files/${fileId}`, { name: nextName });
      setFiles((prev) =>
        prev.map((file) => (file.id === fileId ? { ...file, originalName: nextName, name: nextName } : file))
      );
      cancelRename();
      toast.success('File updated.');
    } catch {
      toast.error('Failed to update file.');
    } finally {
      setSavingFileId('');
    }
  };

  const deleteFile = async (fileId) => {
    setDeletingFileId(fileId);
    try {
      await api.delete(`/files/${fileId}`);
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
      toast.success('File deleted.');
    } catch {
      toast.error('Failed to delete file.');
    } finally {
      setDeletingFileId('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">AI-Powered Quiz Generation</h1>
        <p className="text-gray-400">Upload a PDF, DOCX, or TXT and generate questions automatically</p>
      </motion.div>

      {/* Upload Area */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-8">
        {!selectedFile ? (
          <div onDrop={handleDrop} onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-orange-500/50 transition-colors cursor-pointer">
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleInputChange} className="hidden" />
            <Upload size={48} className="text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Drop your file here or click to browse</h3>
            <p className="text-gray-400 mb-4">PDF, DOCX, TXT files up to 10MB</p>
            <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              Select File
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File info */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <FileText size={24} className="text-orange-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{selectedFile.name}</h4>
                  <p className="text-gray-400 text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {!uploading && status !== 'completed' && (
                <button onClick={removeFile} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              )}
              {status === 'completed' && <Check size={24} className="text-emerald-400" />}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{status === 'processing' ? 'Processing file...' : 'Uploading...'}</span>
                  <span className="text-orange-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                    animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>
            )}

            {/* Processing spinner */}
            {status === 'processing' && !uploading && (
              <div className="flex items-center gap-3 text-purple-400 p-4 bg-purple-500/10 rounded-lg">
                <Loader2 size={20} className="animate-spin" />
                <span>AI is analyzing your file and generating questions...</span>
              </div>
            )}

            {/* Failed */}
            {status === 'failed' && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                Failed to process file. Please try another file.
              </div>
            )}

            {/* Upload button */}
            {!uploading && !status && (
              <button onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload size={20} /> {uploading ? 'Uploading...' : 'Upload & Generate Questions'}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Generated Questions */}
      <AnimatePresence>
        {questions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Generated Questions</h3>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 text-sm">{selectedIndices.length}/{questions.length} selected</span>
                <button onClick={() => setSelectedIndices(questions.map((_, i) => i))}
                  className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 transition-colors">
                  Select All
                </button>
                <button onClick={() => setSelectedIndices([])}
                  className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 transition-colors">
                  Deselect All
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {questions.map((question, index) => {
                const isSelected = selectedIndices.includes(index);
                return (
                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    onClick={() => toggleQuestion(index)}
                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-white/5 opacity-60'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-500'}`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <h4 className="text-white font-semibold">{index + 1}. {question.question}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-8">
                      {question.options.map((opt, optIdx) => {
                        const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
                        return (
                          <div key={optIdx} className={`p-2 rounded-lg text-sm border ${correctIdx === optIdx ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'border-white/10 text-gray-400'}`}>
                            <span className="font-mono text-xs mr-2 opacity-60">{['A','B','C','D'][optIdx]}.</span>
                            {opt}
                            {correctIdx === optIdx && <span className="ml-2 text-xs text-emerald-400">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Create Quiz button */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowConfirm(true)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-bold flex items-center justify-center gap-2">
                <BookOpen size={20} /> Use {selectedIndices.length} Question{selectedIndices.length !== 1 ? 's' : ''}
              </button>
              <button onClick={() => { setStatus(null); setQuestions([]); setUploadProgress(0); setUploading(false); handleUpload(); }}
                className="px-6 py-3 glass rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                <RefreshCw size={18} /> Regenerate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass rounded-2xl p-8 max-w-md w-full border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Save Generated Quiz</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Quiz Title</label>
                  <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                    placeholder="e.g. Chapter 1 Quiz"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Number of questions</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedIndices.length}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Available from selected pool: <span className="text-orange-400 font-bold">{selectedIndices.length}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 glass rounded-lg text-white hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreateQuiz} disabled={creating}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Check size={18} /> Save Quiz</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {generatedAccessCode && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-emerald-500/30">
          <h3 className="text-xl font-bold text-white mb-2">Quiz saved successfully</h3>
          <p className="text-gray-300 mb-3">Student access code:</p>
          <div className="text-3xl font-mono font-bold tracking-widest text-emerald-400">{generatedAccessCode}</div>
        </motion.div>
      )}

      {/* Features */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Sparkles, title: "Auto Generated", description: "Questions extracted directly from your PDF content" },
          { icon: Check, title: "Review & Select", description: "Choose which questions to include in your quiz" },
          { icon: BookOpen, title: "Instant Quiz", description: "Quiz is saved to your dashboard ready to use" },
        ].map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }}
              className="glass rounded-2xl p-6 text-center">
              <Icon size={32} className="text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Uploaded Files Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Uploaded Files</h3>
          <button
            onClick={fetchFiles}
            className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {filesLoading ? (
          <div className="py-10 text-center text-gray-400">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="py-10 text-center text-gray-400">No uploaded files yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-white/10">
                  <th className="py-3">File Name</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Size</th>
                  <th className="py-3">Upload Date</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-white">
                      {editingFileId === file.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-orange-500"
                        />
                      ) : (
                        <span>{file.originalName || file.name}</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-300 uppercase">{file.type || '-'}</td>
                    <td className="py-3 text-gray-300">{formatSize(file.size)}</td>
                    <td className="py-3 text-gray-300">{formatDate(file.uploadDate || file.createdAt)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {editingFileId === file.id ? (
                          <>
                            <button
                              onClick={() => saveRename(file.id)}
                              disabled={savingFileId === file.id}
                              className="px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white inline-flex items-center gap-1 disabled:opacity-60"
                            >
                              <Save size={14} /> Update
                            </button>
                            <button
                              onClick={cancelRename}
                              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1"
                            >
                              <X size={14} /> Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startRename(file)}
                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1"
                          >
                            <Pencil size={14} /> Update
                          </button>
                        )}

                        <button
                          onClick={() => deleteFile(file.id)}
                          disabled={deletingFileId === file.id}
                          className="px-3 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white inline-flex items-center gap-1 disabled:opacity-60"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default UploadPDFPage;
