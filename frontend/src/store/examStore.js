import { create } from 'zustand';

export const useExamStore = create((set) => ({
  currentExam: null,
  attempt: null,
  questions: [],
  responses: [],
  currentIndex: 0,
  flagged: new Set(),
  remainingSeconds: 0,
  violations: [],
  serverTimeDiff: 0,

  setExamData: (exam, attempt, questions, remainingSeconds) =>
    set({
      currentExam: exam,
      attempt,
      questions,
      remainingSeconds,
      responses: questions.map((q) => ({
        questionId: q._id,
        selectedOptions: [],
        timeSpentSecs: 0,
      })),
      currentIndex: 0,
      flagged: new Set(),
      violations: [],
    }),

  resumeExamData: (exam, attempt, questions, remainingSeconds) =>
    set({
      currentExam: exam,
      attempt,
      questions,
      remainingSeconds,
      responses: attempt.responses?.length > 0
        ? attempt.responses
        : questions.map((q) => ({
            questionId: q._id,
            selectedOptions: [],
            timeSpentSecs: 0,
          })),
      currentIndex: 0,
      flagged: new Set(),
      violations: attempt.violations || [],
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  selectOption: (questionIndex, optionIndex, isMultiple) =>
    set((state) => {
      const newResponses = [...state.responses];
      const resp = { ...newResponses[questionIndex] };
      if (isMultiple) {
        const selected = [...resp.selectedOptions];
        const idx = selected.indexOf(optionIndex);
        if (idx > -1) {
          selected.splice(idx, 1);
        } else {
          selected.push(optionIndex);
        }
        resp.selectedOptions = selected;
      } else {
        resp.selectedOptions = [optionIndex];
      }
      newResponses[questionIndex] = resp;
      return { responses: newResponses };
    }),

  clearResponse: (questionIndex) =>
    set((state) => {
      const newResponses = [...state.responses];
      newResponses[questionIndex] = {
        ...newResponses[questionIndex],
        selectedOptions: [],
      };
      return { responses: newResponses };
    }),

  toggleFlag: (index) =>
    set((state) => {
      const newFlagged = new Set(state.flagged);
      if (newFlagged.has(index)) {
        newFlagged.delete(index);
      } else {
        newFlagged.add(index);
      }
      return { flagged: newFlagged };
    }),

  updateTimeSpent: (questionIndex, seconds) =>
    set((state) => {
      const newResponses = [...state.responses];
      newResponses[questionIndex] = {
        ...newResponses[questionIndex],
        timeSpentSecs: (newResponses[questionIndex].timeSpentSecs || 0) + seconds,
      };
      return { responses: newResponses };
    }),

  decrementTimer: () =>
    set((state) => ({
      remainingSeconds: Math.max(0, state.remainingSeconds - 1),
    })),

  addViolation: (violation) =>
    set((state) => ({
      violations: [...state.violations, violation],
    })),

  resetExam: () =>
    set({
      currentExam: null,
      attempt: null,
      questions: [],
      responses: [],
      currentIndex: 0,
      flagged: new Set(),
      remainingSeconds: 0,
      violations: [],
    }),
}));
