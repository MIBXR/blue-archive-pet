import { PetPlayer } from './pet-runtime.js?v=5';

const card = document.querySelector('[data-chair-story]');
if (card) initializeChairStory(card);

function initializeChairStory(card) {
  const canvas = card.querySelector('[data-chair-canvas]');
  const fallback = card.querySelector('[data-chair-fallback]');
  const controls = card.querySelector('[data-chair-controls]');
  const spinButton = card.querySelector('[data-chair-spin]');
  const nextButton = card.querySelector('[data-chair-next]');
  const followInput = card.querySelector('[data-chair-follow]');
  const visual = card.querySelector('[data-chair-visual]');
  const directionLabel = card.querySelector('[data-chair-direction]');
  const feedback = card.querySelector('[data-chair-feedback]');
  const pauseButton = document.querySelector('[data-pause]');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const directions = ['正上方', '右上偏上', '右上方', '右上偏右', '正右方', '右下偏右', '右下方', '右下偏下', '正下方', '左下偏下', '左下方', '左下偏左', '正左方', '左上偏左', '左上方', '左上偏上'];
  const initialDirection = 8;
  let player;
  let ready = false;
  let disposed = false;
  let direction = initialDirection;
  let spinning = false;
  let timer = null;

  card.dataset.chairDirection = String(initialDirection);
  card.dataset.chairSpinning = 'false';

  try {
    // This canvas deliberately has no .pet-player class: its story state is independent.
    player = new PetPlayer(canvas, { pet: 'toki', paused: true });
    player.setDirection(initialDirection);
  } catch {
    feedback.textContent = '转椅动作暂时无法载入，先看看她的坐姿。';
    return;
  }

  function isPaused() { return pauseButton?.getAttribute('aria-pressed') === 'true'; }
  function canSpin() { return ready && !disposed && !document.hidden && !isPaused() && !motionQuery.matches; }

  function setDirection(next) {
    direction = (next + 16) % 16;
    player.setDirection(direction);
    card.dataset.chairDirection = String(direction);
    directionLabel.textContent = `${directions[direction]} · ${String(direction + 1).padStart(2, '0')} / 16`;
    canvas.setAttribute('aria-label', `时坐在转椅上，朝向${directions[direction]}`);
  }

  function stopSpin() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    spinning = false;
    card.dataset.chairSpinning = 'false';
    spinButton.removeAttribute('aria-busy');
  }

  function syncEnvironment() {
    if (disposed) return;
    const wasSpinning = spinning;
    player.setPaused(document.hidden || isPaused() || motionQuery.matches);
    if (!canSpin()) stopSpin();
    spinButton.disabled = !canSpin() || spinning;
    nextButton.disabled = !ready;
    followInput.disabled = !canSpin();
    if (!ready) return;
    if (motionQuery.matches) feedback.textContent = '已减少动态效果，用「下一方向」慢慢看看她。';
    else if (isPaused()) feedback.textContent = '自动转动已暂停，也可以逐个方向静静欣赏。';
    else if (wasSpinning && document.hidden) feedback.textContent = '转动已停在刚才的方向。';
    else if (!spinning) feedback.textContent = '点「转一圈」，看看她坐着椅子转回来。';
  }

  spinButton.addEventListener('click', () => {
    if (!canSpin() || spinning) return;
    const startDirection = direction;
    let steps = 0;
    spinning = true;
    card.dataset.chairSpinning = 'true';
    spinButton.disabled = true;
    spinButton.setAttribute('aria-busy', 'true');
    feedback.textContent = '时开始转椅子了。';
    function tick() {
      timer = null;
      if (!canSpin()) { syncEnvironment(); return; }
      steps += 1;
      setDirection(startDirection + steps);
      if (steps === 16) {
        stopSpin();
        spinButton.disabled = !canSpin();
        feedback.textContent = '转完一圈，回到刚才的方向。';
      } else timer = setTimeout(tick, 130);
    }
    timer = setTimeout(tick, 130);
  });

  nextButton.addEventListener('click', () => {
    if (!ready || disposed) return;
    stopSpin();
    followInput.checked = false;
    setDirection(direction + 1);
    spinButton.disabled = !canSpin();
    feedback.textContent = `转向${directions[direction]}。`;
  });

  function followPointer(event) {
    if (!canSpin() || spinning || !followInput.checked) return;
    const rect = visual.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    if (Math.hypot(dx, dy) < 18) return;
    const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
    const next = Math.round(angle / (Math.PI * 2) * 16) % 16;
    if (next !== direction) setDirection(next);
  }
  visual.addEventListener('pointermove', followPointer);
  visual.addEventListener('pointerdown', followPointer);

  const pauseObserver = new MutationObserver(syncEnvironment);
  if (pauseButton) pauseObserver.observe(pauseButton, { attributes: true, attributeFilter: ['aria-pressed'] });
  motionQuery.addEventListener('change', syncEnvironment);
  document.addEventListener('visibilitychange', syncEnvironment);
  window.addEventListener('pageshow', event => { if (event.persisted) syncEnvironment(); });
  window.addEventListener('pagehide', event => {
    stopSpin();
    if (event.persisted || disposed) return;
    disposed = true;
    pauseObserver.disconnect();
    motionQuery.removeEventListener('change', syncEnvironment);
    document.removeEventListener('visibilitychange', syncEnvironment);
    player.destroy();
  });

  player.prepareDirections().then(() => {
    if (disposed) return;
    ready = true;
    setDirection(initialDirection);
    fallback.hidden = true;
    canvas.hidden = false;
    controls.hidden = false;
    card.dataset.chairReady = 'true';
    syncEnvironment();
  }).catch(() => {
    if (disposed) return;
    feedback.textContent = '转椅动作暂时无法载入，先看看她的坐姿。';
    card.dataset.chairReady = 'error';
  });
}
