require('dotenv').config();
const { extractQuestionsFromText } = require('./utils/gemini');
(async () => {
  try {
    const questions = await extractQuestionsFromText("Test Question 1: What is 2+2? \n A) 3 \n B) 4 \n Correct: B");
    console.log("Success:", questions);
  } catch(e) {
    console.error("Error:", e);
  }
})();
