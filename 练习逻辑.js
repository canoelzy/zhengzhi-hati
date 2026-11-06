(function (root) {
  'use strict';
  const bank = root.QUESTION_BANK || [];
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function grade(question, chosen) {
    if (!question.answer.length) return null;
    return [...new Set(chosen)].sort().join('') === [...question.answer].sort().join('');
  }
  function selectQuestions(filters, records, favorites) {
    return bank.filter(q => (!filters.subject || q.subject === filters.subject)
      && (filters.chapter === '' || q.chapter === Number(filters.chapter))
      && (!filters.type || q.type === filters.type)
      && (!filters.query || (q.stem + Object.values(q.options).join(' ') + q.id).includes(filters.query.trim()))
      && (filters.mode !== 'wrong' || records[q.id]?.correct === false)
      && (filters.mode !== 'star' || favorites.includes(q.id))
      && (filters.mode !== 'pending' || !q.answer.length));
  }
  function statistics(records) {
    const valid = bank.map(q => records[q.id]).filter(Boolean);
    const graded = valid.filter(r => typeof r.correct === 'boolean');
    const correct = graded.filter(r => r.correct).length;
    return {done: valid.length, correct, wrong: graded.length - correct,
      graded: graded.length, accuracy: graded.length ? Math.round(correct / graded.length * 100) : null};
  }
  function cleanProgress(raw) {
    const records = {};
    for (const q of bank) {
      const r = raw?.records?.[q.id];
      if (r && Array.isArray(r.chosen) && r.chosen.length && r.chosen.every(k => Object.hasOwn(q.options, k))) {
        records[q.id] = {chosen: [...new Set(r.chosen)].sort(), correct: grade(q, r.chosen),
          attempts: Math.max(1, Math.min(Number(r.attempts) || 1, 100000)), at: String(r.at || '')};
      }
    }
    const favorites = Array.isArray(raw?.favorites) ? bank.filter(q => raw.favorites.includes(q.id)).map(q => q.id) : [];
    return {records, favorites};
  }
  root.Quiz = {shuffle, grade, selectQuestions, statistics, cleanProgress};
})(globalThis);
