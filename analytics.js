(function () {
  const counterId = Number(window.MY_PES_METRIKA_ID || 0);
  const isConfigured = Number.isInteger(counterId) && counterId > 0;

  if (isConfigured) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (let j = 0; j < document.scripts.length; j += 1) {
        if (document.scripts[j].src === r) return;
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = `${r}?id=${counterId}`;
      a.parentNode.insertBefore(k, a);
    }(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym'));

    window.ym(counterId, 'init', {
      ssr: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href
    });
  }

  function clean(value) {
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
    }
    if (typeof value === 'string') return value.slice(0, 120);
    return value;
  }

  function goal(name, params = {}) {
    if (!isConfigured || typeof window.ym !== 'function') return;
    window.ym(counterId, 'reachGoal', name, clean(params));
  }

  function answer(questionId, optionIds, questionIndex, questionStage) {
    const selected = Array.isArray(optionIds) ? optionIds : [optionIds];
    const payload = {
      quiz: {
        question_id: questionId,
        option_ids: selected.filter(Boolean).sort().join('|'),
        question_index: questionIndex,
        stage: questionStage
      }
    };
    goal('quiz_answer', payload);
    if (isConfigured && typeof window.ym === 'function') {
      window.ym(counterId, 'params', { quiz_answers: { [questionId]: payload.quiz.option_ids } });
    }
  }

  window.MyPesAnalytics = {
    configured: isConfigured,
    goal,
    answer
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-donation]');
    if (!link) return;
    goal('donation_click', { placement: link.dataset.donation || 'unknown' });
  });
}());
