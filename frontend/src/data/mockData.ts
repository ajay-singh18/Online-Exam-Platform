export const currentUser = {
  name: "John Mathews",
  email: "john.m@university.edu",
  role: "student" as const,
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBOY5znu4RVLDO6XKJkaC5LMpf-6U1hxN9mKHWlXtE2er8XyqwBvpHd3e9xg6VgEi616BlAXlmGtVMREgflx1pOcrOUjzti3zuy93M8rrDSQO-6nQB9x0Uu660jrGKZELKT0KRXAzRc94WMTnRhgNxmBGyXPQdBmZfovds7oXSRHY-774blA9CDhPJ9djdDLvS8ElCFyUILa-Assl0tjdpXtuSIQKBHjIOjPnrdKJmKr8B7U8_5_oecr7Biiaeo3piwNGN6b6WBTg",
};

export const studentStats = {
  examsCompleted: 24,
  examsThisMonth: 3,
  averageScore: 88.4,
  percentile: "Top 10%",
  instituteRank: 12,
  totalStudents: 450,
};

export const upcomingExams = [
  {
    id: "1",
    title: "Advanced Macroeconomics Final",
    description:
      "Final certification exam for the spring semester. Ensure your environment is secure and webcam is operational.",
    date: "Today, May 24",
    time: "2:00 PM",
    duration: "120 Minutes",
    proctored: true,
    status: "Live in 45 mins",
    featured: true,
  },
  {
    id: "2",
    title: "Quantitative Analysis",
    description:
      "Mid-term assessment focusing on statistical models and data visualization techniques.",
    date: "Tomorrow",
    time: "10:00 AM",
    duration: "60 Mins",
    proctored: true,
    status: "Coming Tomorrow",
    featured: false,
  },
];

export const completedExams = [
  {
    id: "1",
    name: "Organic Chemistry II",
    icon: "science",
    date: "May 12, 2024",
    score: 92,
    total: 100,
    percentage: 92,
  },
  {
    id: "2",
    name: "Modern World History",
    icon: "history",
    date: "May 05, 2024",
    score: 78,
    total: 100,
    percentage: 78,
  },
  {
    id: "3",
    name: "Data Structures & Algos",
    icon: "terminal",
    date: "Apr 28, 2024",
    score: 95,
    total: 100,
    percentage: 95,
  },
];

export const examQuestions = [
  {
    id: 1,
    text: "What is the primary function of the Federal Reserve System?",
    options: [
      "To manage the national debt",
      "To control monetary policy and regulate banks",
      "To collect federal taxes",
      "To manage government spending",
    ],
    correctAnswer: 1,
    type: "mcq" as const,
  },
  {
    id: 2,
    text: "Which economic indicator measures the total value of goods and services produced within a country?",
    options: ["CPI", "GDP", "GNP", "NNP"],
    correctAnswer: 1,
    type: "mcq" as const,
  },
  {
    id: 3,
    text: "In the IS-LM model, what does the IS curve represent?",
    options: [
      "Equilibrium in the money market",
      "Equilibrium in the goods market",
      "The relationship between interest rates and prices",
      "The trade balance equilibrium",
    ],
    correctAnswer: 1,
    type: "mcq" as const,
  },
  {
    id: 4,
    text: "What is the Big O complexity of a balanced binary search tree insertion?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: 1,
    type: "mcq" as const,
  },
  {
    id: 5,
    text: "Define the concept of elasticity in economics and provide an example.",
    options: [],
    correctAnswer: -1,
    type: "essay" as const,
  },
];

export const examDetails = {
  id: "exam-001",
  title: "Mid-Term Differential Equations",
  subject: "Mathematics",
  totalQuestions: 5,
  duration: 120,
  instructions: [
    "Ensure your webcam is active throughout the exam.",
    "No external resources are permitted. Close all other applications.",
    "Do not leave the exam window. Full-screen mode is enforced.",
    "You may flag questions for review before submission.",
    "The exam will auto-submit when time expires.",
  ],
  rules: [
    "AI proctoring is active and will log all anomalies.",
    "Any violation may result in exam cancellation.",
    "Ensure a stable internet connection.",
  ],
};

export const examResult = {
  examTitle: "Organic Chemistry II",
  date: "May 12, 2024",
  duration: "95 of 120 Minutes",
  totalScore: 92,
  totalPossible: 100,
  percentage: 92,
  rank: 5,
  totalStudents: 120,
  sections: [
    { name: "Multiple Choice", score: 45, total: 50, percentage: 90 },
    { name: "Short Answer", score: 28, total: 30, percentage: 93 },
    { name: "Essay", score: 19, total: 20, percentage: 95 },
  ],
  strengths: ["Organic Reactions", "Molecular Structure", "Stereochemistry"],
  weaknesses: ["Spectroscopy Analysis", "Reaction Mechanisms"],
};

// Admin data
export const adminStats = {
  totalStudents: 2847,
  activeExams: 12,
  completionRate: 94.2,
  averageScore: 76.8,
  flaggedSessions: 23,
};

export const adminExams = [
  {
    id: "1",
    title: "Advanced Macroeconomics Final",
    students: 245,
    status: "Active",
    date: "May 24, 2024",
    avgScore: 78,
  },
  {
    id: "2",
    title: "Organic Chemistry II",
    students: 180,
    status: "Completed",
    date: "May 12, 2024",
    avgScore: 82,
  },
  {
    id: "3",
    title: "Data Structures & Algorithms",
    students: 310,
    status: "Scheduled",
    date: "May 28, 2024",
    avgScore: 0,
  },
  {
    id: "4",
    title: "Modern World History",
    students: 150,
    status: "Completed",
    date: "May 05, 2024",
    avgScore: 71,
  },
  {
    id: "5",
    title: "Quantitative Analysis",
    students: 200,
    status: "Scheduled",
    date: "May 25, 2024",
    avgScore: 0,
  },
];

export const questionBank = [
  {
    id: "1",
    text: "What is the primary function of the Federal Reserve?",
    subject: "Economics",
    difficulty: "Medium",
    type: "MCQ",
    usedIn: 5,
  },
  {
    id: "2",
    text: "Explain the concept of Supply and Demand.",
    subject: "Economics",
    difficulty: "Easy",
    type: "Essay",
    usedIn: 8,
  },
  {
    id: "3",
    text: "Calculate the derivative of f(x) = 3x² + 2x - 5",
    subject: "Mathematics",
    difficulty: "Hard",
    type: "MCQ",
    usedIn: 3,
  },
  {
    id: "4",
    text: "Describe the process of mitosis.",
    subject: "Biology",
    difficulty: "Medium",
    type: "Short Answer",
    usedIn: 12,
  },
  {
    id: "5",
    text: "What is Ohm's Law?",
    subject: "Physics",
    difficulty: "Easy",
    type: "MCQ",
    usedIn: 15,
  },
  {
    id: "6",
    text: "Analyze the causes of World War I.",
    subject: "History",
    difficulty: "Hard",
    type: "Essay",
    usedIn: 2,
  },
];

export const studentsSample = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice.j@uni.edu",
    examsCompleted: 18,
    avgScore: 91,
    status: "Active",
  },
  {
    id: "2",
    name: "Bob Williams",
    email: "bob.w@uni.edu",
    examsCompleted: 15,
    avgScore: 84,
    status: "Active",
  },
  {
    id: "3",
    name: "Carol Smith",
    email: "carol.s@uni.edu",
    examsCompleted: 22,
    avgScore: 77,
    status: "Flagged",
  },
  {
    id: "4",
    name: "David Brown",
    email: "david.b@uni.edu",
    examsCompleted: 20,
    avgScore: 88,
    status: "Active",
  },
  {
    id: "5",
    name: "Eve Davis",
    email: "eve.d@uni.edu",
    examsCompleted: 12,
    avgScore: 95,
    status: "Active",
  },
];

// SuperAdmin data
export const institutes = [
  {
    id: "1",
    name: "MIT School of Engineering",
    students: 4250,
    admins: 12,
    exams: 340,
    status: "Active",
    plan: "Enterprise",
  },
  {
    id: "2",
    name: "Stanford University",
    students: 3800,
    admins: 10,
    exams: 290,
    status: "Active",
    plan: "Enterprise",
  },
  {
    id: "3",
    name: "Oxford Academy",
    students: 2100,
    admins: 6,
    exams: 180,
    status: "Active",
    plan: "Professional",
  },
  {
    id: "4",
    name: "Tokyo Tech Institute",
    students: 1500,
    admins: 4,
    exams: 120,
    status: "Pending",
    plan: "Starter",
  },
];

export const platformStats = {
  totalInstitutes: 248,
  totalUsers: 125000,
  totalExams: 45200,
  systemUptime: 99.97,
  revenue: "$2.4M",
};

export const sidebarStudentLinks = [
  { label: "Dashboard", icon: "dashboard", path: "/student" },
  { label: "Exams", icon: "assignment", path: "/student/exams" },
  { label: "Results", icon: "analytics", path: "/student/results" },
  { label: "Settings", icon: "settings", path: "/student/settings" },
  { label: "Help", icon: "help", path: "/student/help" },
];

export const sidebarAdminLinks = [
  { label: "Dashboard", icon: "dashboard", path: "/admin" },
  { label: "Exams", icon: "assignment", path: "/admin/exams" },
  { label: "Question Bank", icon: "database", path: "/admin/questions" },
  { label: "Question Editor", icon: "edit_note", path: "/admin/editor" },
  { label: "Batches", icon: "groups", path: "/admin/batches" },
  { label: "Analytics", icon: "analytics", path: "/admin/analytics" },
  { label: "Results", icon: "fact_check", path: "/admin/results" },
  { label: "Report Cards", icon: "school", path: "/admin/report-cards" },
  { label: "Settings", icon: "settings", path: "/admin/settings" },
  { label: "Help", icon: "help", path: "/admin/help" },
];

export const sidebarSuperAdminLinks = [
  { label: "Dashboard", icon: "dashboard", path: "/superadmin" },
  { label: "Institutes", icon: "business", path: "/superadmin/institutes" },
  { label: "Users", icon: "group", path: "/superadmin/users" },
  {
    label: "Platform Analytics",
    icon: "analytics",
    path: "/superadmin/analytics",
  },
  { label: "Settings", icon: "settings", path: "/superadmin/settings" },
  { label: "Help", icon: "help", path: "/superadmin/help" },
];
