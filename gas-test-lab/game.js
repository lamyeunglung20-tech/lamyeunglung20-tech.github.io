const state = {
  round: 0, phase: 'intro', score: 0,
  methodMistakes: 0, observationMistakes: 0, bonusMistakes: 0,
  muted: false, timer: null, lang: 'en'
};
const views = ['introView', 'playView', 'resultView', 'bonusView', 'endView'];
const sceneLabels = {
  oxygen: '氧氣', hydrogen: '氫氣', lime: '石灰水',
  indicator: '碳酸氫鹽指示劑', water: '乾燥氯化鈷試紙'
};

// Record original text nodes once. Dynamic game text is handled by setDynamic().
const staticNodes = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  const node = walker.currentNode;
  const key = node.nodeValue.trim();
  if (!EN[key]) continue;
  const leading = node.nodeValue.match(/^\s*/)[0];
  const trailing = node.nodeValue.match(/\s*$/)[0];
  staticNodes.push({node, key, leading, trailing});
}
function tr(zh, lang = state.lang) { return lang === 'en' ? (EN[zh] || zh) : zh; }
function setDynamic(target, zh, en = EN[zh] || zh) {
  const element = typeof target === 'string' ? $(target) : target;
  element.dataset.zh = zh;
  element.dataset.en = en;
  element.textContent = state.lang === 'en' ? en : zh;
}
function showView(id) { views.forEach(view => $(view).classList.toggle('active', view === id)); }
function updateProgress() {
  const completed = state.phase === 'end' ? 6 : state.phase === 'bonus' ? 5 : state.round;
  $('score').textContent = state.score;
  $('progressCount').textContent = `${completed} / 6`;
  $('progressFill').style.width = `${completed / 6 * 100}%`;
  const zh = state.phase === 'intro' ? '準備開始' : state.phase === 'bonus' ? '最後挑戰' : state.phase === 'end' ? '挑戰完成' : `第 ${state.round + 1} 個實驗`;
  const en = state.phase === 'intro' ? 'Ready to begin' : state.phase === 'bonus' ? 'Final challenge' : state.phase === 'end' ? 'Mission complete' : `Experiment ${state.round + 1}`;
  setDynamic('stepLabel', zh, en);
  [...$('levelMap').children].forEach((step, index) => {
    step.classList.toggle('done', index < completed);
    step.classList.toggle('current', index === completed && state.phase !== 'end');
  });
}
function choiceList(items, correctId, type) {
  const wrap = $('choices');
  wrap.replaceChildren();
  items.forEach((id, index) => {
    const item = (type === 'method' ? methodPool : observationPool).find(option => option.id === id);
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'choice'; button.dataset.id = id;
    const letter = document.createElement('span'); letter.className = 'choice-letter'; letter.textContent = 'ABCD'[index];
    const label = document.createElement('span'); setDynamic(label, item.text);
    button.append(letter, label);
    button.addEventListener('click', () => choose(id, correctId, type, button));
    wrap.append(button);
  });
}
function setFeedback(zh, good = false, en = EN[zh] || zh) {
  const element = $('feedback');
  setDynamic(element, zh, en);
  element.classList.toggle('good', good);
}
function playTone(kind) {
  if (state.muted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx(), oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = kind === 'pop' ? 'square' : 'sine';
    oscillator.frequency.setValueAtTime(kind === 'pop' ? 290 : 520, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'pop' ? 120 : 820, ctx.currentTime + .18);
    gain.gain.setValueAtTime(.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.08, ctx.currentTime + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .25);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(); oscillator.stop(ctx.currentTime + .26);
    oscillator.onended = () => ctx.close();
  } catch { /* Sound is optional. */ }
}
function renderRound() {
  clearTimeout(state.timer);
  state.phase = 'method'; state.methodMistakes = 0; state.observationMistakes = 0;
  const round = rounds[state.round];
  showView('playView');
  const number = String(state.round + 1).padStart(2, '0');
  setDynamic('roundBadge', `實驗 ${number} / 05`, `EXPERIMENT ${number} / 05`);
  $('roundNumber').textContent = number;
  setDynamic('gasName', round.gas);
  $('gasFormula').textContent = round.formula;
  const scene = $('scene');
  scene.innerHTML = scenes[round.scene];
  scene.dataset.scene = round.scene;
  scene.classList.remove('play');
  setDynamic(scene.querySelector('.hint-mark'), sceneLabels[round.scene]);
  if (round.scene === 'hydrogen') setDynamic(scene.querySelector('.pop-text'), '卜！', 'POP!');
  scene.querySelector('svg').setAttribute('aria-label', tr('氣體測試模擬實驗'));
  setDynamic('sceneCaption', '選好方法後，實驗會在這裏播放。');
  $('replayButton').hidden = true;
  $('questionStep').textContent = 'STEP 01 / 02';
  setDynamic('questionTitle', '你會使用哪一種方法？');
  setDynamic('questionHelp', state.round === 3 ? '這次試試二氧化碳的另一種測試方法。' : '選擇適合這個實驗的測試方法。');
  choiceList(round.methods, round.method, 'method');
  setFeedback('');
  updateProgress();
}
function choose(id, correctId, type, button) {
  if (state.phase !== type) return;
  const round = rounds[state.round];
  if (id !== correctId) {
    button.classList.add('wrong');
    if (type === 'method') {
      state.methodMistakes++;
      setFeedback(`再試一次。提示：${round.hint}`, false, `${tr('再試一次。提示：', 'en')}${tr(round.hint, 'en')}`);
    } else {
      state.observationMistakes++;
      setFeedback('再仔細看動畫，留意實驗用品的變化。');
    }
    setTimeout(() => button.classList.remove('wrong'), 650);
    return;
  }
  button.classList.add('correct');
  [...$('choices').children].forEach(option => { option.disabled = true; });
  const firstTry = type === 'method' ? state.methodMistakes === 0 : state.observationMistakes === 0;
  state.score += firstTry ? 2 : 1;
  updateProgress();
  playTone(type === 'observation' && round.scene === 'hydrogen' ? 'pop' : 'success');
  if (type === 'method') {
    state.phase = 'animating';
    setFeedback('方法正確！請觀察實驗動畫。', true);
    state.timer = setTimeout(() => {
      animateScene();
      state.timer = setTimeout(showObservations, 2600);
    }, 360);
  } else {
    state.phase = 'result';
    state.timer = setTimeout(showResult, 580);
  }
}
function animateScene() {
  const scene = $('scene');
  scene.classList.remove('play');
  void scene.offsetWidth;
  scene.classList.add('play');
  scene.querySelector('svg').setAttribute('aria-label', tr(rounds[state.round].caption));
  setDynamic('sceneCaption', '觀察中……');
}
function showObservations() {
  const round = rounds[state.round];
  state.phase = 'observation';
  $('questionStep').textContent = 'STEP 02 / 02';
  setDynamic('questionTitle', '你觀察到甚麼變化？');
  setDynamic('questionHelp', '根據剛才的動畫，選出這個測試的結果。');
  setDynamic('sceneCaption', '動畫已完成。需要的話可以重播。');
  $('replayButton').hidden = false;
  choiceList(round.observations, round.observation, 'observation');
  setFeedback('');
}
function confetti() {
  const field = $('resultConfetti');
  field.replaceChildren();
  const colors = ['#ffbf4e', '#6acbb5', '#f390a9', '#87bfe0'];
  for (let i = 0; i < 26; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--x', `${Math.random() * 100}%`);
    piece.style.setProperty('--delay', `${Math.random() * .5}s`);
    piece.style.setProperty('--tilt', `${Math.random() * 720 - 360}deg`);
    piece.style.background = colors[i % colors.length];
    field.append(piece);
  }
}
function showResult() {
  const round = rounds[state.round];
  showView('resultView');
  confetti();
  setDynamic('resultKicker', '配對成功 · EXPERIMENT COMPLETE');
  setDynamic('resultTitle', `${round.gas}測試成功！`, `${tr(round.gas, 'en')} test complete!`);
  setDynamic('resultExplanation', round.explanation);
  setDynamic('resultFact', round.fact);
  setDynamic('nextButtonText', state.round === rounds.length - 1 ? '最後挑戰' : '下一個實驗');
  updateProgress();
}
function showBonus() {
  state.phase = 'bonus'; state.bonusMistakes = 0;
  showView('bonusView');
  setDynamic('bonusFeedback', '');
  $('bonusFeedback').classList.remove('good');
  [...$('bonusChoices').children].forEach(button => {
    button.disabled = false; button.classList.remove('correct', 'wrong');
  });
  updateProgress();
}
function finish() {
  state.phase = 'end';
  showView('endView');
  setDynamic('finalScore', `你的得分：${state.score} / 21`, `Your score: ${state.score} / 21`);
  updateProgress();
}
function showGuide() { $('guideDialog').showModal(); }
function applyLanguage(lang) {
  state.lang = lang === 'en' ? 'en' : 'zh-Hant';
  try { localStorage.setItem('gasLabLanguage', state.lang); } catch { /* Offline file may restrict storage. */ }
  document.documentElement.lang = state.lang;
  document.title = state.lang === 'en' ? 'Gas Test Adventure | Interactive game' : '氣體測試實驗室｜互動配對遊戲';
  staticNodes.forEach(({node, key, leading, trailing}) => {
    if (node.isConnected) node.nodeValue = `${leading}${tr(key)}${trailing}`;
  });
  document.querySelectorAll('[data-zh]').forEach(element => {
    element.textContent = state.lang === 'en' ? element.dataset.en : element.dataset.zh;
  });
  $('languageSelect').value = state.lang;
  document.querySelector('.brand').setAttribute('aria-label', state.lang === 'en' ? 'Gas Test Lab home' : '氣體測試實驗室首頁');
  $('game').setAttribute('aria-label', state.lang === 'en' ? 'Gas test game' : '氣體測試遊戲');
  $('levelMap').setAttribute('aria-label', state.lang === 'en' ? 'Mission progress' : '任務進度');
  document.querySelector('.how-steps').setAttribute('aria-label', state.lang === 'en' ? 'How to play in three steps' : '玩法三步');
  $('closeGuideButton').setAttribute('aria-label', state.lang === 'en' ? 'Close field guide' : '關閉圖鑑');
  setDynamic('soundButton', state.muted ? '音效：關' : '音效：開');
  $('soundButton').setAttribute('aria-pressed', String(!state.muted));
  updateProgress();
  const svg = $('scene').querySelector('svg');
  if (svg) svg.setAttribute('aria-label', tr(state.phase === 'method' ? '氣體測試模擬實驗' : rounds[state.round].caption));
}

$('startButton').addEventListener('click', renderRound);
$('nextButton').addEventListener('click', () => {
  if (state.round < rounds.length - 1) { state.round++; renderRound(); }
  else showBonus();
});
$('restartButton').addEventListener('click', () => { state.round = 0; state.score = 0; renderRound(); });
$('homeButton').addEventListener('click', () => {
  clearTimeout(state.timer);
  state.round = 0;
  state.score = 0;
  state.phase = 'intro';
  state.methodMistakes = 0;
  state.observationMistakes = 0;
  state.bonusMistakes = 0;
  showView('introView');
  updateProgress();
});
$('replayButton').addEventListener('click', () => {
  animateScene();
  state.timer = setTimeout(() => setDynamic('sceneCaption', '動畫已完成。需要的話可以重播。'), 2600);
});
$('bonusChoices').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.answer === 'yes') {
    state.bonusMistakes++; button.classList.add('wrong');
    setDynamic('bonusFeedback', '再想想：這兩類氣體都可能使火焰熄滅。');
    setTimeout(() => button.classList.remove('wrong'), 750);
    return;
  }
  button.classList.add('correct');
  [...$('bonusChoices').children].forEach(option => { option.disabled = true; });
  setDynamic('bonusFeedback', '答對！相同的現象不能單獨區分兩種氣體。');
  $('bonusFeedback').classList.add('good');
  if (state.bonusMistakes === 0) state.score++;
  playTone('success');
  state.timer = setTimeout(finish, 1800);
});
$('guideButton').addEventListener('click', showGuide);
$('endGuideButton').addEventListener('click', showGuide);
$('closeGuideButton').addEventListener('click', () => $('guideDialog').close());
$('guideDialog').addEventListener('click', event => { if (event.target === $('guideDialog')) $('guideDialog').close(); });
$('soundButton').addEventListener('click', () => {
  state.muted = !state.muted;
  setDynamic('soundButton', state.muted ? '音效：關' : '音效：開');
  $('soundButton').setAttribute('aria-pressed', String(!state.muted));
});
$('languageSelect').addEventListener('change', event => applyLanguage(event.target.value));

try {
  const saved = localStorage.getItem('gasLabLanguage');
  if (saved === 'en' || saved === 'zh-Hant') state.lang = saved;
} catch { /* Offline file may restrict storage. */ }
applyLanguage(state.lang);
