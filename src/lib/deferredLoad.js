const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel"];

/** Start an enhancement only after the visitor actively uses the page. */
export function runAfterFirstInteraction(callback) {
  let active = true;

  const cleanup = () => {
    INTERACTION_EVENTS.forEach((eventName) =>
      window.removeEventListener(eventName, run),
    );
  };

  const run = () => {
    if (!active) return;
    active = false;
    cleanup();
    callback();
  };

  INTERACTION_EVENTS.forEach((eventName) =>
    window.addEventListener(eventName, run, { once: true, passive: true }),
  );

  return () => {
    active = false;
    cleanup();
  };
}

/**
 * Run non-critical work after the page is usable. A real user interaction starts
 * it immediately, while the timeout keeps the feature available for passive
 * visitors without competing with the first render.
 */
export function runAfterInteractionOrTimeout(callback, timeout = 15000) {
  let active = true;
  let timeoutId;

  const cleanup = () => {
    INTERACTION_EVENTS.forEach((eventName) =>
      window.removeEventListener(eventName, run),
    );
    window.clearTimeout(timeoutId);
  };

  const run = () => {
    if (!active) return;
    active = false;
    cleanup();
    callback();
  };

  INTERACTION_EVENTS.forEach((eventName) =>
    window.addEventListener(eventName, run, { once: true, passive: true }),
  );
  timeoutId = window.setTimeout(run, timeout);

  return () => {
    active = false;
    cleanup();
  };
}

/**
 * Start core analytics after the initial page load has settled, while still
 * allowing an early user action to start it immediately.
 */
export function runAfterInteractionOrLoadDelay(callback, delay = 1500) {
  let active = true;
  let timeoutId;

  const cleanup = () => {
    INTERACTION_EVENTS.forEach((eventName) =>
      window.removeEventListener(eventName, run),
    );
    window.removeEventListener("load", schedule);
    window.clearTimeout(timeoutId);
  };

  const run = () => {
    if (!active) return;
    active = false;
    cleanup();
    callback();
  };

  const schedule = () => {
    if (!active) return;
    timeoutId = window.setTimeout(run, delay);
  };

  INTERACTION_EVENTS.forEach((eventName) =>
    window.addEventListener(eventName, run, { once: true, passive: true }),
  );

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    active = false;
    cleanup();
  };
}

/** Schedule visual enhancement after load and an idle period. */
export function runAfterPageIdle(callback, timeout = 2500) {
  let active = true;
  let idleId;
  let timeoutId;

  const run = () => {
    if (!active) return;
    active = false;
    callback();
  };

  const schedule = () => {
    if (!active) return;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout });
    } else {
      timeoutId = window.setTimeout(run, timeout);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    active = false;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }
    window.clearTimeout(timeoutId);
  };
}
