// ARPG-style floating combat text: a short label that spawns over a
// target element, drifts up, and fades — one per event, independent
// of any other spawned on the same or a different target, so they can
// overlap freely.
import { qs } from './dom.js';

// Total lifetime must stay >= style.css's rise+hold+fade transition
// sum for .floating-text-rise, or this removes the node mid-fade.
const LIFETIME_MS = 2300;

// target is either an Element to spawn on directly, or a selector
// string resolved against the document (e.g. a slot's wrapper, or
// '#enemy').
export function spawnFloatingText(target, text, variant = '', extraClass = '') {
  const wrapper = typeof target === 'string' ? qs(target) : target;
  if (!wrapper || !text) return;

  const el = document.createElement('span');
  el.className = ['floating-text', variant && `floating-text-${variant}`, extraClass].filter(Boolean).join(' ');
  el.textContent = text;
  wrapper.appendChild(el);

  requestAnimationFrame(() => el.classList.add('floating-text-rise'));
  setTimeout(() => el.remove(), LIFETIME_MS);
}
