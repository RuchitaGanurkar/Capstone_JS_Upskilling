let toastHost = null;

function getToastHost() {
  if (toastHost && toastHost.isConnected) return toastHost;
  toastHost = document.createElement("div");
  toastHost.id = "toast-host";
  toastHost.className = "toast-host";
  toastHost.setAttribute("aria-live", "polite");
  document.body.appendChild(toastHost);
  return toastHost;
}

export function toast(message, opts) {
  const variant = (opts && opts.variant) || "info";
  const host = getToastHost();
  const el = document.createElement("div");
  el.className = "toast toast--" + variant;
  el.setAttribute("role", "status");
  el.textContent = message;
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

  function cleanup() {
    document.removeEventListener("keydown", onKey);
    backdrop.removeEventListener("click", onBackdropClick);
    document.body.classList.remove("modal-open");
    backdrop.remove();
    if (opts.onClose) opts.onClose();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      cleanup();
    }
  }

  function onBackdropClick(e) {
    if (e.target === backdrop) cleanup();
  }

  document.addEventListener("keydown", onKey);
  backdrop.addEventListener("click", onBackdropClick);

  const firstBtn = dialog.querySelector("button, input, select, textarea");
  if (firstBtn && firstBtn.focus) firstBtn.focus();

  return cleanup;
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
