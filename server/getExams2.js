const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/ajaysmac/Projects/Online Exam Platform/server/.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const exams = await db.collection('exams').find({}).sort({createdAt:-1}).limit(2).toArray();
  exams.forEach(e => {
    console.log(`Title: ${e.title}`);
    console.log(`  startAt: ${e.startAt ? new Date(e.startAt).toLocaleString() : 'null'} (raw: ${e.startAt})`);
    console.log(`  endAt:   ${e.endAt ? new Date(e.endAt).toLocaleString() : 'null'} (raw: ${e.endAt})`);
  });
  process.exit();
}).catch(console.error);
