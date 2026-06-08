let toastHost = null;
const TOAST_MAX = 5;
const TOAST_STAGGER_MS = 80;

function getToastHost() {
  if (toastHost && toastHost.isConnected) return toastHost;
  toastHost = document.createElement("div");
  toastHost.id = "toast-host";
  toastHost.className = "toast-host";
  toastHost.setAttribute("aria-live", "polite");
  document.body.appendChild(toastHost);
  return toastHost;
}

function pruneToasts(host) {
  const nodes = host.querySelectorAll(".toast");
  while (nodes.length >= TOAST_MAX) {
    nodes[0].remove();
  }
}

export function toast(message, opts) {
  const variant = (opts && opts.variant) || "info";
  const host = getToastHost();
  pruneToasts(host);

  const el = document.createElement("div");
  el.className = "toast toast--" + variant;
  el.setAttribute("role", "status");
  el.textContent = message;
  el.style.animationDelay = Math.min(host.children.length * TOAST_STAGGER_MS, 400) + "ms";
  host.appendChild(el);

  const t = window.setTimeout(function () {
    el.classList.add("toast--out");
    window.setTimeout(function () {
      el.remove();
    }, 220);
  }, 3000);
  el.addEventListener("click", function () {
    window.clearTimeout(t);
    el.remove();
  });
}

let loaderEl = null;
let loaderDepth = 0;

export function showFullScreenLoader(message) {
  loaderDepth++;
  if (!loaderEl) {
    loaderEl = document.createElement("div");
    loaderEl.id = "app-full-loader";
    loaderEl.className = "app-full-loader";
    loaderEl.setAttribute("role", "status");
    loaderEl.setAttribute("aria-live", "polite");
    loaderEl.innerHTML =
      '<div class="app-full-loader__panel">' +
      '<span class="app-full-loader__spinner" aria-hidden="true"></span>' +
      '<span class="app-full-loader__text"></span>' +
      "</div>";
    document.body.appendChild(loaderEl);
  }
  const textEl = loaderEl.querySelector(".app-full-loader__text");
  if (textEl) textEl.textContent = message || "Loading…";
  loaderEl.hidden = false;
  document.body.classList.add("app-full-loader-open");
}

export function hideFullScreenLoader() {
  loaderDepth = Math.max(0, loaderDepth - 1);
  if (loaderDepth > 0) return;
  if (loaderEl) loaderEl.hidden = true;
  document.body.classList.remove("app-full-loader-open");
}

export function openModal(opts) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  if (opts.title) {
    const h = document.createElement("h2");
    h.className = "modal-title";
    h.textContent = opts.title;
    dialog.appendChild(h);
  }

  const body = document.createElement("div");
  body.className = "modal-body";
  body.appendChild(opts.panel);
  dialog.appendChild(body);

  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");

  let removed = false;

  function cleanup() {
    if (removed) return;
    removed = true;
    document.removeEventListener("keydown", onKey);
    backdrop.removeEventListener("click", onBackdropClick);
    document.body.classList.remove("modal-open");
    backdrop.remove();
    if (opts.onClose) opts.onClose();
  }

  function finishClose() {
    backdrop.classList.add("modal-backdrop--exit");
    dialog.classList.add("modal-dialog--exit");
    window.setTimeout(cleanup, 200);
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      finishClose();
    }
  }

  function onBackdropClick(e) {
    if (e.target === backdrop) finishClose();
  }

  document.addEventListener("keydown", onKey);
  backdrop.addEventListener("click", onBackdropClick);

  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      if (!backdrop.isConnected) return;
      backdrop.classList.add("modal-backdrop--enter");
      dialog.classList.add("modal-dialog--enter");
    });
  });

  const firstBtn = dialog.querySelector("button, input, select, textarea");
  if (firstBtn && firstBtn.focus) firstBtn.focus();

  return finishClose;
}

export function confirmDialog(message, opts) {
  const yes = (opts && opts.confirmText) || "Yes";
  const no = (opts && opts.cancelText) || "No";

  return new Promise(function (resolve) {
    const panel = document.createElement("div");
    panel.className = "confirm-dialog";

    const p = document.createElement("p");
    p.className = "confirm-dialog__message";
    p.textContent = message;
    panel.appendChild(p);

    const actions = document.createElement("div");
    actions.className = "confirm-dialog__actions";

    let done = false;
    function finish(ok) {
      if (done) return;
      done = true;
      close();
      resolve(ok);
    }

    const btnNo = document.createElement("button");
    btnNo.type = "button";
    btnNo.className = "btn btn-secondary btn-sm";
    btnNo.textContent = no;
    btnNo.addEventListener("click", function () {
      finish(false);
    });

    const btnYes = document.createElement("button");
    btnYes.type = "button";
    btnYes.className = "btn btn-primary btn-sm";
    btnYes.textContent = yes;
    btnYes.addEventListener("click", function () {
      finish(true);
    });

    actions.appendChild(btnNo);
    actions.appendChild(btnYes);
    panel.appendChild(actions);

    const close = openModal({
      title: "Confirm",
      panel: panel,
      onClose: function () {
        if (!done) {
          done = true;
          resolve(false);
        }
      },
    });
  });
}
