(function () {
  "use strict";

  const meta = document.querySelector('meta[name="calendar-release"]');
  const pageRelease = meta && meta.content;
  if (!pageRelease || pageRelease === "__CALENDAR_RELEASE_ID__") return;

  const RELEASE_ID_PATTERN = /^[A-Za-z0-9._-]{1,160}$/;
  const CHECK_INTERVAL_MS = 300_000;
  const IDLE_BEFORE_RELOAD_MS = 15_000;
  const MIN_NOTICE_VISIBLE_MS = 8_000;
  const DISMISS_MS = 5 * 60_000;
  let pendingRelease = "";
  let releaseDetectedAt = 0;
  let lastActivityAt = Date.now();
  let pausedUntil = 0;
  let checkInProgress = false;
  let autoReloadTimer = null;
  let notice = null;

  function hasActiveWork() {
    const active = document.activeElement;
    if (active && active !== document.body && active.matches &&
        active.matches("input, textarea, select, [contenteditable='true']") &&
        active.getClientRects().length > 0) return true;

    return Array.from(document.querySelectorAll('[role="dialog"], dialog[open], #calFilterHost.open')).some(function (element) {
      if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" &&
        element.getClientRects().length > 0;
    });
  }

  function reloadToLatest() {
    if (!pendingRelease) return;
    window.location.reload();
  }

  function makeNotice() {
    if (notice) return notice;
    notice = document.createElement("section");
    notice.id = "calendar-release-update";
    notice.className = "release-update-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");

    const message = document.createElement("p");
    message.className = "release-update-message";
    message.textContent = "ভর্তি ক্যালেন্ডারে নতুন আপডেট এসেছে। সর্বশেষ তথ্য দেখাতে পেজটি স্বয়ংক্রিয়ভাবে আপডেট হবে।";

    const actions = document.createElement("div");
    actions.className = "release-update-actions";

    const updateButton = document.createElement("button");
    updateButton.type = "button";
    updateButton.className = "release-update-primary";
    updateButton.textContent = "এখনই আপডেট";
    updateButton.addEventListener("click", reloadToLatest);

    const laterButton = document.createElement("button");
    laterButton.type = "button";
    laterButton.className = "release-update-secondary";
    laterButton.textContent = "পরে";
    laterButton.addEventListener("click", function () {
      pausedUntil = Date.now() + DISMISS_MS;
      notice.hidden = true;
      scheduleAutoReload();
    });

    actions.append(updateButton, laterButton);
    notice.append(message, actions);
    document.body.prepend(notice);
    return notice;
  }

  function scheduleAutoReload() {
    if (autoReloadTimer !== null) {
      window.clearTimeout(autoReloadTimer);
      autoReloadTimer = null;
    }
    if (!pendingRelease) return;

    const now = Date.now();
    if (now < pausedUntil || hasActiveWork() || document.visibilityState !== "visible") {
      autoReloadTimer = window.setTimeout(scheduleAutoReload, Math.max(1000, Math.min(10_000, pausedUntil - now || 5000)));
      return;
    }

    if (notice) notice.hidden = false;
    const idleFor = now - lastActivityAt;
    const noticeAge = now - releaseDetectedAt;
    if (idleFor < IDLE_BEFORE_RELOAD_MS || noticeAge < MIN_NOTICE_VISIBLE_MS) {
      const idleRemaining = Math.max(0, IDLE_BEFORE_RELOAD_MS - idleFor);
      const noticeRemaining = Math.max(0, MIN_NOTICE_VISIBLE_MS - noticeAge);
      autoReloadTimer = window.setTimeout(scheduleAutoReload, Math.max(500, idleRemaining, noticeRemaining));
      return;
    }
    reloadToLatest();
  }

  function acceptRelease(releaseId) {
    if (typeof releaseId !== "string" || !RELEASE_ID_PATTERN.test(releaseId) ||
        releaseId === pageRelease || releaseId === pendingRelease) return;
    pendingRelease = releaseId;
    releaseDetectedAt = Date.now();
    makeNotice().hidden = false;
    scheduleAutoReload();
  }

  async function checkReleaseManifest() {
    if (checkInProgress || !navigator.onLine || document.visibilityState !== "visible") return;
    checkInProgress = true;
    try {
      const url = new URL("/release.json", window.location.origin);
      url.searchParams.set("_cb", String(Date.now()));
      const response = await fetch(url.href, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Cache-Control": "no-cache" }
      });
      if (!response.ok) return;
      const manifest = await response.json();
      if (manifest && typeof manifest.id === "string") acceptRelease(manifest.id);
    } catch (_) {
      // Offline or temporarily unavailable: retry on the next visibility/online check.
    } finally {
      checkInProgress = false;
    }
  }

  function markActivity() {
    lastActivityAt = Date.now();
    if (pendingRelease) scheduleAutoReload();
  }

  ["pointerdown", "keydown", "touchstart", "scroll", "input"].forEach(function (type) {
    document.addEventListener(type, markActivity, { passive: true, capture: true });
  });
  document.addEventListener("focusout", function () {
    window.setTimeout(scheduleAutoReload, 0);
  });
  document.addEventListener("click", function () {
    window.setTimeout(scheduleAutoReload, 0);
  });
  window.addEventListener("online", checkReleaseManifest);
  window.addEventListener("focus", checkReleaseManifest);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkReleaseManifest();
      scheduleAutoReload();
    }
  });

  checkReleaseManifest();
  window.setInterval(checkReleaseManifest, CHECK_INTERVAL_MS);
})();
