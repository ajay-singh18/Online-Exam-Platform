require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Institute = require('./models/Institute');
const Question = require('./models/Question');
const Exam = require('./models/Exam');
const Attempt = require('./models/Attempt');

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...\n');

    /* Clear existing data */
    await User.deleteMany({});
    await Institute.deleteMany({});
    await Question.deleteMany({});
    await Exam.deleteMany({});
    await Attempt.deleteMany({});

    /* 1. Create Institute */
    const institute = await Institute.create({
      name: 'Bright Academy',
      ownerEmail: 'admin@brightacademy.com',
      plan: 'starter',
      studentLimit: 200,
      adminLimit: 5,
    });
    console.log('✅ Institute created:', institute.name);

    /* 2. Create Users (hash manually to avoid double-hashing via pre-save hook) */
    const passwordHash = await bcrypt.hash('password123', 12);

    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@examplatform.com',
      passwordHash,
      role: 'superAdmin',
      isVerified: true,
    });
    // Bypass pre-save rehash by using updateOne
    await User.updateOne({ _id: superAdmin._id }, { passwordHash });

    const admin = await User.create({
      name: 'Prof. Sharma',
      email: 'admin@brightacademy.com',
      passwordHash,
      role: 'admin',
      instituteId: institute._id,
      isVerified: true,
    });
    await User.updateOne({ _id: admin._id }, { passwordHash });

    const studentNames = ['Aarav Patel', 'Priya Singh', 'Rohan Gupta'];
    const students = [];
    for (let i = 0; i < studentNames.length; i++) {
      const student = await User.create({
        name: studentNames[i],
        email: `student${i + 1}@brightacademy.com`,
        passwordHash,
        role: 'student',
        instituteId: institute._id,
        isVerified: true,
      });
      await User.updateOne({ _id: student._id }, { passwordHash });
      students.push(student);
    }
    console.log('✅ Users created: 1 superAdmin, 1 admin, 3 students');

    /* 3. Create 10 Sample Questions */
    const questionsData = [
      {
        text: '<p>What is the time complexity of binary search?</p>',
        type: 'mcq',
        options: [
          { text: 'O(n)', isCorrect: false },
          { text: 'O(log n)', isCorrect: true },
          { text: 'O(n²)', isCorrect: false },
          { text: 'O(1)', isCorrect: false },
        ],
        topic: 'Algorithms',
        difficulty: 'easy',
      },
      {
        text: '<p>Which data structure uses LIFO principle?</p>',
        type: 'mcq',
        options: [
          { text: 'Queue', isCorrect: false },
          { text: 'Stack', isCorrect: true },
          { text: 'Array', isCorrect: false },
          { text: 'Linked List', isCorrect: false },
        ],
        topic: 'Data Structures',
        difficulty: 'easy',
      },
      {
        text: '<p>What is the output of <code>typeof null</code> in JavaScript?</p>',
        type: 'mcq',
        options: [
          { text: '"null"', isCorrect: false },
          { text: '"undefined"', isCorrect: false },
          { text: '"object"', isCorrect: true },
          { text: '"boolean"', isCorrect: false },
        ],
        topic: 'JavaScript',
        difficulty: 'medium',
      },
      {
        text: '<p>Which of the following are valid HTTP methods? (Select all that apply)</p>',
        type: 'msq',
        options: [
          { text: 'GET', isCorrect: true },
          { text: 'FETCH', isCorrect: false },
          { text: 'PUT', isCorrect: true },
          { text: 'PATCH', isCorrect: true },
        ],
        topic: 'Web Development',
        difficulty: 'medium',
      },
      {
        text: '<p>A binary tree with n nodes has exactly n-1 edges.</p>',
        type: 'truefalse',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ],
        topic: 'Data Structures',
        difficulty: 'easy',
      },
      {
        text: '<p>What is the worst-case time complexity of QuickSort?</p>',
        type: 'mcq',
        options: [
          { text: 'O(n log n)', isCorrect: false },
          { text: 'O(n)', isCorrect: false },
          { text: 'O(n²)', isCorrect: true },
          { text: 'O(log n)', isCorrect: false },
        ],
        topic: 'Algorithms',
        difficulty: 'medium',
      },
      {
        text: '<p>Which protocol does HTTPS use for encryption?</p>',
        type: 'mcq',
        options: [
          { text: 'SSH', isCorrect: false },
          { text: 'TLS/SSL', isCorrect: true },
          { text: 'FTP', isCorrect: false },
          { text: 'SMTP', isCorrect: false },
        ],
        topic: 'Networking',
        difficulty: 'easy',
      },
      {
        text: '<p>In SQL, which statement is used to extract data from a database?</p>',
        type: 'mcq',
        options: [
          { text: 'EXTRACT', isCorrect: false },
          { text: 'GET', isCorrect: false },
          { text: 'SELECT', isCorrect: true },
          { text: 'PULL', isCorrect: false },
        ],
        topic: 'Databases',
        difficulty: 'easy',
      },
      {
        text: '<p>What does the <strong>CAP theorem</strong> state about distributed systems?</p>',
        type: 'mcq',
        options: [
          { text: 'You can have Consistency, Availability, and Partition tolerance simultaneously', isCorrect: false },
          { text: 'You can only guarantee two of three: Consistency, Availability, Partition tolerance', isCorrect: true },
          { text: 'Distributed systems cannot be consistent', isCorrect: false },
          { text: 'Partition tolerance is optional', isCorrect: false },
        ],
        topic: 'System Design',
        difficulty: 'hard',
      },
      {
        text: '<p>React uses a virtual DOM to optimize rendering performance.</p>',
        type: 'truefalse',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ],
        topic: 'Web Development',
        difficulty: 'easy',
      },
    ];

    const questions = await Question.insertMany(
      questionsData.map((q) => ({
        ...q,
        createdBy: admin._id,
        instituteId: institute._id,
      }))
    );
    console.log('✅ 10 sample questions created');

    /* 4. Create Exam with 5 questions, 10-min timer */
    const examQuestions = questions.slice(0, 5).map((q) => q._id);
    const exam = await Exam.create({
      title: 'Computer Science Fundamentals — Mock Test',
      description: 'A 10-minute assessment covering algorithms, data structures, and web development basics.',
      durationMins: 10,
      startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // started 2 days ago
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),   // ends in 30 days
      questions: examQuestions,
      randomizeQuestions: true,
      randomizeOptions: true,
      fullscreenRequired: true,
      passMark: 40,
      allowedStudents: students.map((s) => s._id),
      instituteId: institute._id,
      createdBy: admin._id,
    });
    console.log('✅ Exam created:', exam.title);

    /* 5. Create a completed attempt for student1 */
    const attemptStartedAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const attempt = await Attempt.create({
      examId: exam._id,
      userId: students[0]._id,
      startedAt: attemptStartedAt,
      questionOrder: examQuestions,
      optionOrderMap: new Map(),
      seed: 42,
      responses: [
        { questionId: examQuestions[0], selectedOptions: [1], timeSpentSecs: 45 },
        { questionId: examQuestions[1], selectedOptions: [1], timeSpentSecs: 30 },
        { questionId: examQuestions[2], selectedOptions: [2], timeSpentSecs: 60 },
        { questionId: examQuestions[3], selectedOptions: [0, 2, 3], timeSpentSecs: 90 },
        { questionId: examQuestions[4], selectedOptions: [0], timeSpentSecs: 25 },
      ],
      violations: [
        { type: 'tabSwitch', timestamp: new Date(attemptStartedAt.getTime() + 120000) },
        { type: 'fullscreenExit', timestamp: new Date(attemptStartedAt.getTime() + 300000) },
      ],
      score: 4,
      totalMarks: 5,
      percentage: 80,
      passed: true,
      submittedAt: new Date(attemptStartedAt.getTime() + 8 * 60 * 1000),
    });
    console.log('✅ Sample attempt created for', students[0].name);

    console.log('\n🎉 Seeding complete! Use these credentials to login:\n');
    console.log('  Super Admin:  superadmin@examplatform.com  / password123');
    console.log('  Admin:        admin@brightacademy.com      / password123');
    console.log('  Student 1:    student1@brightacademy.com   / password123');
    console.log('  Student 2:    student2@brightacademy.com   / password123');
    console.log('  Student 3:    student3@brightacademy.com   / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
