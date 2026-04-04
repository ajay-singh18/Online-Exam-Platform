const fs = require('fs');
const pdf = require('pdf-parse');
const { extractQuestionsFromText } = require('./utils/gemini');

(async () => {
    try {
        const buffer = fs.readFileSync('sample.pdf');
        const data = await pdf(buffer);
        console.log("PDF parsed successfully. Text length:", data.text.length);
        const questions = await extractQuestionsFromText(data.text);
        console.log("Questions Extracted:", questions);
    } catch(e) {
        console.error("Test Error:", e);
    }
})();
