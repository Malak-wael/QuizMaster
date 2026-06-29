export const mockQuizzes = [
  {
    id: 1,
    title: "Math Fundamentals",
    questions: [
      {
        id: 1,
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1
      },
      {
        id: 2,
        question: "What is 10 × 5?",
        options: ["45", "50", "55", "60"],
        correctAnswer: 1
      },
      {
        id: 3,
        question: "What is the square root of 16?",
        options: ["2", "3", "4", "5"],
        correctAnswer: 2
      }
    ],
    createdAt: "2024-04-10",
    status: "active"
  },
  {
    id: 2,
    title: "Science Basics",
    questions: [
      {
        id: 1,
        question: "What is H2O?",
        options: ["Oxygen", "Hydrogen", "Water", "Carbon"],
        correctAnswer: 2
      },
      {
        id: 2,
        question: "How many planets are in our solar system?",
        options: ["7", "8", "9", "10"],
        correctAnswer: 1
      }
    ],
    createdAt: "2024-04-09",
    status: "completed"
  }
];

export const mockStudents = [
  { id: 1, name: "Alice Johnson", score: 95, rank: 1, quizId: 1 },
  { id: 2, name: "Bob Smith", score: 88, rank: 2, quizId: 1 },
  { id: 3, name: "Charlie Brown", score: 82, rank: 3, quizId: 1 },
  { id: 4, name: "Diana Prince", score: 78, rank: 4, quizId: 1 },
  { id: 5, name: "Eve Wilson", score: 75, rank: 5, quizId: 1 },
];

export const mockTournament = {
  id: 1,
  name: "Math Championship 2024",
  rounds: [
    {
      round: 1,
      matches: [
        { id: 1, player1: "Alice", player2: "Bob", winner: "Alice", score: "3-2" },
        { id: 2, player1: "Charlie", player2: "Diana", winner: "Diana", score: "3-1" },
        { id: 3, player1: "Eve", player2: "Frank", winner: "Eve", score: "3-0" },
        { id: 4, player1: "Grace", player2: "Henry", winner: "Grace", score: "3-2" }
      ]
    },
    {
      round: 2,
      matches: [
        { id: 5, player1: "Alice", player2: "Diana", winner: "Alice", score: "3-1" },
        { id: 6, player1: "Eve", player2: "Grace", winner: "Eve", score: "3-2" }
      ]
    },
    {
      round: 3,
      matches: [
        { id: 7, player1: "Alice", player2: "Eve", winner: "TBD", score: "0-0" }
      ]
    }
  ]
};

export const mockTeacherStats = {
  totalQuizzes: 12,
  totalStudents: 45,
  activeQuizzes: 3,
  averageScore: 82.5
};

export const mockRecentActivity = [
  { id: 1, type: "quiz_created", message: "Created new quiz: History Quiz", time: "2 hours ago" },
  { id: 2, type: "student_joined", message: "5 students joined Math Fundamentals", time: "4 hours ago" },
  { id: 3, type: "tournament_completed", message: "Science Tournament completed", time: "1 day ago" },
  { id: 4, type: "quiz_completed", message: "15 students completed Geography Quiz", time: "2 days ago" }
];
