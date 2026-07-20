export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function setText(selector, value, root = document) {
  const node = qs(selector, root);
  if (node) node.textContent = value;
}
