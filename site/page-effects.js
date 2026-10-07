// Decorative pointer motion shares the existing playback button's public state.
// The animation stage is deliberately outside these targets.
const root = document.documentElement;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const pauseButton = document.querySelector('[data-pause]');
const records = [];
const pending = new Map();
let frame = null;
let suspended = false;
let enabled = false;

const neutral = { x: 0, y: 0, lift: 0, axisX: 0, axisY: 1, angle: 0 };
const clamp = value => Math.max(-1, Math.min(1, value));

function paint(record, values) {
  const style = record.target.style;
  style.setProperty('--pointer-x', `${values.x.toFixed(3)}px`);
  style.setProperty('--pointer-y', `${values.y.toFixed(3)}px`);
  style.setProperty('--pointer-lift', `${values.lift.toFixed(3)}px`);
  style.setProperty('--pointer-axis-x', values.axisX.toFixed(4));
  style.setProperty('--pointer-axis-y', values.axisY.toFixed(4));
  style.setProperty('--pointer-angle', `${values.angle.toFixed(3)}deg`);
}

function cancelFrame() {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  pending.clear();
}

function reset(record) {
  pending.delete(record);
  record.bounds = null;
  record.target.classList.remove('pointer-effect-active');
  paint(record, neutral);
}

function resetAll() {
  cancelFrame();
  for (const record of records) reset(record);
}

function updateAvailability() {
  enabled = finePointer.matches && !reducedMotion.matches && !document.hidden &&
    !suspended && pauseButton?.getAttribute('aria-pressed') !== 'true';
  root.dataset.pageEffects = enabled ? 'enabled' : 'disabled';
  if (!enabled) resetAll();
}

function unavailable(record) {
  return !enabled || record.target.matches(':disabled, [aria-disabled="true"]');
}

function flush() {
  frame = null;
  if (!enabled) { pending.clear(); return; }
  for (const [record, values] of pending) {
    if (unavailable(record)) reset(record);
    else {
      record.target.classList.add('pointer-effect-active');
      paint(record, values);
    }
  }
  pending.clear();
}

function bind(zone, target, kind, { x = 0, y = 0, lift = 0, tilt = 0 } = {}) {
  if (!zone || !target || zone.closest('[data-stage]')) return;
  const record = { zone, target, bounds: null };
  records.push(record);
  target.classList.add('pointer-effect', `pointer-effect-${kind}`);
  paint(record, neutral);

  function move(event) {
    if (event.pointerType !== 'mouse' || unavailable(record)) return;
    // Cache the resting geometry for this hover so the tilt cannot feed itself.
    record.bounds ??= zone.getBoundingClientRect();
    const bounds = record.bounds;
    if (!bounds.width || !bounds.height) return;
    const horizontal = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1);
    const vertical = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1);
    const distance = Math.hypot(horizontal, vertical);
    pending.set(record, {
      x: horizontal * x, y: vertical * y, lift,
      axisX: distance ? -vertical / distance : 0,
      axisY: distance ? horizontal / distance : 1,
      angle: Math.min(1, distance) * tilt,
    });
    if (frame === null) frame = requestAnimationFrame(flush);
  }

  zone.addEventListener('pointerenter', move, { passive: true });
  zone.addEventListener('pointermove', move, { passive: true });
  zone.addEventListener('pointerleave', () => reset(record), { passive: true });
  zone.addEventListener('pointercancel', () => reset(record), { passive: true });
  return record;
}

for (const art of document.querySelectorAll('.hero-art')) {
  const calm = document.body.dataset.pet === 'toki';
  bind(art, art.querySelector('.hero-main'), 'portrait', {
    x: calm ? 6 : 10, y: calm ? 5 : 8, tilt: calm ? .25 : .45,
  });
}
for (const card of document.querySelectorAll('.collection-card')) {
  const calm = card.classList.contains('collection-card-toki');
  bind(card, card, 'card', { lift: -2, tilt: calm ? 1.2 : 1.6 });
  bind(card.querySelector('.collection-art'), card.querySelector('.collection-character'),
    'portrait', { x: calm ? 6 : 8, y: calm ? 4 : 6 });
}
for (const card of document.querySelectorAll('.still-card')) {
  bind(card, card, 'card', { lift: -2, tilt: 1.7 });
}
for (const card of document.querySelectorAll('.download-card')) {
  bind(card, card, 'card', { lift: -2, tilt: .65 });
}
for (const button of document.querySelectorAll('.button:not([data-pause]), .collection-cta')) {
  bind(button, button, 'button', { x: 2.3, y: 1.2, lift: -2 });
}

const stateObserver = new MutationObserver(mutations => {
  if (mutations.some(mutation => mutation.target === pauseButton)) updateAvailability();
  for (const mutation of mutations) {
    for (const record of records) {
      if (record.target === mutation.target && record.target.matches(':disabled, [aria-disabled="true"]')) {
        reset(record);
      }
    }
  }
});
if (pauseButton) stateObserver.observe(pauseButton, { attributes: true, attributeFilter: ['aria-pressed'] });
for (const record of records) {
  if (record.target.matches('button, a')) {
    stateObserver.observe(record.target, { attributes: true, attributeFilter: ['disabled', 'aria-disabled'] });
  }
}

finePointer.addEventListener('change', updateAvailability);
reducedMotion.addEventListener('change', updateAvailability);
document.addEventListener('visibilitychange', updateAvailability);
window.addEventListener('resize', resetAll, { passive: true });
window.addEventListener('scroll', resetAll, { passive: true });
window.addEventListener('blur', resetAll);
document.addEventListener('keydown', event => { if (event.key === 'Tab') resetAll(); });
document.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') resetAll(); }, { passive: true });
window.addEventListener('pagehide', () => { suspended = true; updateAvailability(); });
window.addEventListener('pageshow', () => { suspended = false; updateAvailability(); });
updateAvailability();
