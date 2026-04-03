const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('sample.pdf'));
doc.fontSize(25).text('Test Question 1: What is 2+2? A) 3 B) 4 Correct: B', 100, 100);
doc.end();
