import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function StudentQuizPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultScore, setResultScore] = useState(0);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  useEffect(() => {
    const loadQuiz = async () => {
      const rawSession = localStorage.getItem('currentSession');
      if (!rawSession) {
        toast.error('Join a session first');
        navigate('/student/join');
        return;
      }

      try {
        const session = JSON.parse(rawSession);
        setSessionId(session.id);

        const sessionResponse = await api.get(`/sessions/${session.id}`);
        const quizId = sessionResponse.data.session.quizId;
        const quizResponse = await api.get(`/quizzes/${quizId}`);
        setQuiz(quizResponse.data.quiz);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load quiz');
        navigate('/student/join');
      }
    };

    loadQuiz();
  }, [navigate]);

  useEffect(() => {
    if (timeLeft > 0 && !isQuizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isQuizCompleted) {
      submitQuiz(true);
    }
  }, [timeLeft, isQuizCompleted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 30) return 'text-red-400';
    if (timeLeft <= 60) return 'text-orange-400';
    return 'text-emerald-400';
  };

  const selectAnswer = (questionIndex, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };

  const goToNextQuestion = () => {
    if (selectedAnswers[currentQuestion] === undefined) return;
    if (currentQuestion < questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      // Keep previous answers, but reset next question selection on entry.
      setSelectedAnswers((prev) => {
        const copy = { ...prev };
        delete copy[nextIndex];
        return copy;
      });
      setCurrentQuestion(nextIndex);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    if (!questions.length) return 0;
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctOptionIndex) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const completeQuiz = (scorePercent, correctCount, totalQs) => {
    const calculatedScore =
      scorePercent !== undefined ? scorePercent : calculateScore();
    const total = totalQs ?? questions.length;
    const correct =
      correctCount !== undefined
        ? correctCount
        : Math.round((calculatedScore / 100) * total);
    setResultScore(calculatedScore);
    localStorage.setItem(
      'lastResult',
      JSON.stringify({
        score: calculatedScore,
        correctAnswers: correct,
        totalQuestions: total,
      })
    );
    setIsQuizCompleted(true);
    toast.success(`Quiz completed! Your score: ${calculatedScore}%`);
  };

  const submitQuiz = async (force = false) => {
    if (!sessionId) return;
    const unansweredQuestions = questions.filter(
      (_, index) => selectedAnswers[index] === undefined
    );

    if (!force && unansweredQuestions.length > 0) {
      setShowConfirmDialog(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const answers = Object.entries(selectedAnswers).map(([questionIndex, selectedOptionIndex]) => {
        const question = questions[Number(questionIndex)];
        const option = question?.options?.[selectedOptionIndex];
        const selectedAnswerId = typeof option === "object" ? option?.id : undefined;
        return {
          questionIndex: Number(questionIndex),
          selectedOptionIndex,
          selectedAnswerId,
        };
      });
      const { data } = await api.post(`/sessions/${sessionId}/submit`, { answers });
      const total = data.total ?? questions.length;
      const scoreCount = data.score ?? 0;
      const pct = total ? Math.round((scoreCount / total) * 100) : 0;
      completeQuiz(pct, scoreCount, total);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmSubmit = async () => {
    setShowConfirmDialog(false);
    await submitQuiz(true);
  };

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / questions.length) * 100;
  };

  if (isQuizCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle size={64} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Quiz Completed!</h2>
          <p className="text-xl text-gray-300 mb-6">
            Your score: <span className="text-emerald-400 font-bold">{resultScore}%</span>
          </p>
          <button
            onClick={() => navigate('/student/results')}
            className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            View Results
          </button>
        </div>
      </motion.div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Loading quiz...
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{quiz.title}</h1>
              <p className="text-gray-400">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
            
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 glass rounded-lg ${getTimeColor()}`}>
              <Clock size={20} />
              <span className="font-bold font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-2xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-8">
              {question.question}
            </h2>

            <div className="space-y-4">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectAnswer(currentQuestion, index)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-white/30'
                    }`}>
                      {selectedAnswers[currentQuestion] === index && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-white text-lg">{typeof option === "object" ? option?.text : option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 glass glass-hover rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  index === currentQuestion
                    ? 'bg-emerald-500 text-white'
                    : selectedAnswers[index] !== undefined
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'glass text-gray-400'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={submitQuiz}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              <CheckCircle size={20} />
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="flex items-center gap-2 px-6 py-3 glass glass-hover rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </motion.div>

        {/* Question Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Question Overview</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`text-center p-2 rounded-lg text-sm ${
                  index === currentQuestion
                    ? 'bg-emerald-500 text-white'
                    : selectedAnswers[index] !== undefined
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                Q{index + 1}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Answered: {Object.keys(selectedAnswers).length}/{questions.length}
            </span>
            <span className="text-emerald-400">
              {Math.round((Object.keys(selectedAnswers).length / questions.length) * 100)}% Complete
            </span>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={24} className="text-orange-400" />
                <h3 className="text-xl font-bold text-white">Submit Quiz?</h3>
              </div>
              <p className="text-gray-300 mb-6">
                You have {questions.filter((_, index) => selectedAnswers[index] === undefined).length} unanswered questions. 
                Are you sure you want to submit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 glass glass-hover rounded-lg text-white"
                >
                  Review Answers
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Submit Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudentQuizPage;
