const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Helper for Question Extraction
 * 
 * Uses Gemini Pro/Flash to parse unstructured text (from PDFs or manual copy-paste)
 * and returns a structured JSON array matching the Question schema.
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractQuestionsFromText = async (text) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = `
    Extract all exam questions from the following text and return them as a valid JSON array.
    
    Rules for extraction:
    1. Identify the question text.
    2. Identify the type: 'mcq' (multiple choice), 'msq' (multiple select), 'truefalse', or 'fillblank'.
    3. For 'mcq' and 'msq', extract options and mark the correct one(s).
    4. For 'truefalse', create two options: 'True' and 'False', and mark which one is correct.
    5. Categorize each question into a broad 'subject' (e.g., Mathematics, Science, Engineering).
    6. Categorize each question into a specific 'topic' or chapter (e.g., Algebra, Physics, Thermodynamics).
    7. Assign a 'difficulty': 'easy', 'medium', or 'hard' based on the question content.

    Output MUST be a JSON array of objects in this EXACT format:
    [{
      "text": "The question content here",
      "type": "mcq",
      "options": [
        { "text": "Option A", "isCorrect": true },
        { "text": "Option B", "isCorrect": false }
      ],
      "subject": "Mathematics",
      "topic": "Algebra",
      "difficulty": "medium"
    }]

    If the text contains images or complex diagrams, describe them in the question text as [Image Description].
    
    TEXT TO PARSE:
    ${text}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textOut = response.text().trim();
    
    if (textOut.startsWith('```json')) {
      textOut = textOut.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (textOut.startsWith('```')) {
      textOut = textOut.replace(/^```/, '').replace(/```$/, '').trim();
    }

    return JSON.parse(textOut);
  } catch (error) {
    console.error('Gemini Extraction Error Details:', error);
    throw new Error(`AI Extraction Failed: ${error.message}`);
  }
};

module.exports = { extractQuestionsFromText };
