const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const docs = await Document.find().sort({ createdAt: -1 }).limit(2);
    console.log(docs);
    process.exit(0);
  });
