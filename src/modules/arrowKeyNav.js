export function initArrowKeyListNav(opts) {
  const root = opts.root;
  const itemSelector = opts.itemSelector;
  const isEnabled = opts.isEnabled;

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (!isEnabled()) return;

      const ae = document.activeElement;
      if (arrowNavBlocked(ae)) return;

      const scope = root && root.nodeType === 1 ? root : document;
      const items = scope.querySelectorAll(itemSelector);
      if (!items.length) return;

      const list = Array.prototype.slice.call(items);
      let idx = -1;
      for (let i = 0; i < list.length; i++) {
        if (list[i] === ae || list[i].contains(ae)) {
          idx = i;
          break;
        }
      }

      e.preventDefault();
      let nextIdx;
      if (e.key === "ArrowDown") {
        nextIdx = idx < 0 ? 0 : Math.min(list.length - 1, idx + 1);
      } else {
        nextIdx = idx < 0 ? list.length - 1 : Math.max(0, idx - 1);
      }

      const next = list[nextIdx];
      if (next && next.focus) next.focus();
    },
    true
  );
}

function arrowNavBlocked(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.matches("input, select, textarea")) return true;
  if (el.matches("button")) {
    const inTicketsBody = el.closest("#tickets-tbody");
    const inRecentLinks = el.closest("#home-recent-list");
    if (inTicketsBody || inRecentLinks) return false;
    return true;
  }
  return false;
}
