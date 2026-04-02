const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/online-exam').then(async () => {
  const db = mongoose.connection.db;
  const exams = await db.collection('exams').find({}).toArray();
  exams.forEach(e => {
    console.log(`Title: ${e.title}`);
    console.log(`  startAt: ${e.startAt} (${new Date(e.startAt).toLocaleString()})`);
    console.log(`  endAt: ${e.endAt} (${new Date(e.endAt).toLocaleString()})`);
  });
  process.exit();
});
