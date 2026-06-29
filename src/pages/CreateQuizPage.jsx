import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';

function CreateQuizPage() {
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }
  ]);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set([1]));

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setQuestions([...questions, newQuestion]);
    setExpandedQuestions(new Set([...expandedQuestions, newQuestion.id]));
  };

  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
      const newExpanded = new Set(expandedQuestions);
      newExpanded.delete(id);
      setExpandedQuestions(newExpanded);
    } else {
      toast.error('You must have at least one question');
    }
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
        : q
    ));
  };

  const toggleQuestionExpanded = (id) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQuestions(newExpanded);
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    const isValid = questions.every((q) => {
      if (!q.question.trim()) return false;
      if (!Array.isArray(q.options) || q.options.length !== 4) return false;
      const normalized = q.options.map((opt) => opt.trim());
      if (normalized.some((opt) => !opt || !/[A-Za-z0-9\u0600-\u06FF]/.test(opt))) return false;
      const unique = new Set(normalized.map((opt) => opt.toLowerCase()));
      if (unique.size !== 4) return false;
      return Boolean(normalized[q.correctAnswer]);
    });

    if (!isValid) {
      toast.error('Each question must have 4 unique, meaningful options and one correct answer.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        title: quizTitle,
        questions: questions.map((q) => ({
          text: q.question,
          options: q.options,
          correctOptionIndex: q.correctAnswer,
        })),
      };

      const quizResponse = await api.post('/quizzes', payload);
      const sessionResponse = await api.post('/sessions', {
        quizId: quizResponse.data.quiz.id,
      });

      localStorage.setItem('currentSession', JSON.stringify(sessionResponse.data.session));
      toast.success(`Quiz saved! Join code: ${sessionResponse.data.session.joinCode}`);
    } catch {
      toast.error('Failed to save quiz. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewQuiz = () => {
    const isValid = questions.some(q => 
      q.question.trim() && 
      q.options.some(opt => opt.trim())
    );

    if (!isValid) {
      toast.error('Add at least one complete question to preview');
      return;
    }

    toast.success('Preview mode coming soon!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Create Quiz</h1>
          <p className="text-gray-400">Design engaging questions for your students</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={previewQuiz}
            className="px-4 py-2 glass glass-hover rounded-lg text-white flex items-center gap-2"
          >
            <Eye size={20} />
            Preview
          </button>
          <button
            onClick={saveQuiz}
            disabled={isSaving}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </motion.div>

      {/* Quiz Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <label className="block text-white font-semibold mb-3">Quiz Title</label>
        <input
          type="text"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          placeholder="Enter quiz title..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </motion.div>

      {/* Questions */}
      <div className="space-y-4">
        <AnimatePresence>
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl overflow-hidden"
            >
              {/* Question Header */}
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleQuestionExpanded(question.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-orange-400 font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {question.question || `Question ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {question.options.filter(opt => opt.trim()).length}/4 options added
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {questions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(question.id);
                      }}
                      className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {expandedQuestions.has(question.id) ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Question Content */}
              <AnimatePresence>
                {expandedQuestions.has(question.id) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-6 space-y-4">
                      {/* Question Text */}
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">Question Text</label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                          placeholder="Enter your question..."
                          rows={3}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                        />
                      </div>

                      {/* Options */}
                      <div>
                        <label className="block text-gray-300 font-medium mb-3">Answer Options</label>
                        <div className="space-y-3">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                  question.correctAnswer === optionIndex
                                    ? 'border-orange-500 bg-orange-500'
                                    : 'border-gray-400 hover:border-gray-300'
                                }`}
                              >
                                {question.correctAnswer === optionIndex && (
                                  <div className="w-2 h-2 bg-white rounded-full mx-auto" />
                                )}
                              </button>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                              />
                              {question.correctAnswer === optionIndex && (
                                <span className="text-emerald-400 text-sm font-medium">Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Question Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: questions.length * 0.1 + 0.2 }}
        onClick={addQuestion}
        className="w-full p-6 glass glass-hover rounded-2xl border-2 border-dashed border-white/20 hover:border-orange-500/50 transition-all group"
      >
        <div className="flex items-center justify-center gap-3">
          <Plus size={24} className="text-orange-400 group-hover:scale-110 transition-transform" />
          <span className="text-orange-400 font-semibold">Add New Question</span>
        </div>
      </motion.button>

      {/* Save Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: questions.length * 0.1 + 0.3 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Quiz Summary</h3>
            <p className="text-gray-400">
              {questions.length} question{questions.length !== 1 ? 's' : ''} · 
              {questions.reduce((total, q) => total + q.options.filter(opt => opt.trim()).length, 0)} options filled
            </p>
          </div>
          <button
            onClick={saveQuiz}
            disabled={isSaving}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default CreateQuizPage;
