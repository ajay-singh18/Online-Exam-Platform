const fs = require('fs');
const pdf = require('pdf-parse');
async function test() {
  const parseFunc = typeof pdf === 'function' ? pdf : (pdf.default || pdf.PDFParse);
  console.log(typeof parseFunc);
}
test();
