/**
 * Scoring engine for exam attempts.
 * Compares student responses against correct answers,
 * using the stored option order map to handle randomized options.
 */

/**
 * Compute score for a submitted attempt.
 *
 * @param {Array} responses    - [{ questionId, selectedOptions: [Number] }]
 * @param {Array} questions    - Populated question documents
 * @param {Map}   optionOrderMap - Map<questionId, originalIndexOrder[]>
 *                                 e.g. { "q1": [2,0,3,1] } means displayed option 0
 *                                 was originally at index 2
 * @returns {{ score, totalMarks, percentage, perQuestion }}
 */
const computeScore = (responses, questions, optionOrderMap) => {
  let score = 0;
  const totalMarks = questions.length;
  const perQuestion = [];

  for (const question of questions) {
    const qId = question._id.toString();
    const response = responses.find((r) => r.questionId?.toString() === qId);
    const correctIndices = question.options
      .map((opt, idx) => (opt.isCorrect ? idx : -1))
      .filter((idx) => idx !== -1);

    let isCorrect = false;

    if (response && response.selectedOptions.length > 0) {
      /* Map selected options back to original indices using option order map */
      let selectedOriginal = response.selectedOptions;
      const orderMap = optionOrderMap?.get(qId);
      if (orderMap && orderMap.length > 0) {
        selectedOriginal = response.selectedOptions.map((idx) => orderMap[idx]);
      }

      if (question.type === 'mcq' || question.type === 'truefalse') {
        /* Single correct answer */
        isCorrect = selectedOriginal.length === 1 && correctIndices.includes(selectedOriginal[0]);
      } else if (question.type === 'msq') {
        /* MSQ: full-correct only (no partial credit) */
        const sortedSelected = [...selectedOriginal].sort();
        const sortedCorrect = [...correctIndices].sort();
        isCorrect =
          sortedSelected.length === sortedCorrect.length &&
          sortedSelected.every((val, idx) => val === sortedCorrect[idx]);
      } else if (question.type === 'fillblank') {
        /* Fill in the blank: compare first option text (case-insensitive) */
        isCorrect = selectedOriginal.length === 1 && correctIndices.includes(selectedOriginal[0]);
      }
    }

    if (isCorrect) score += 1;

    perQuestion.push({
      questionId: qId,
      isCorrect,
      selectedOptions: response?.selectedOptions || [],
      correctOptions: correctIndices,
    });
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  return { score, totalMarks, percentage, perQuestion };
};

module.exports = { computeScore };
