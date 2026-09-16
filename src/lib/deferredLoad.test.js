import {
  runAfterFirstInteraction,
  runAfterInteractionOrLoadDelay,
} from "./deferredLoad";

afterEach(() => {
  jest.useRealTimers();
});

test("starts core analytics after load delay for a passive visitor", () => {
  jest.useFakeTimers();
  const callback = jest.fn();
  const cleanup = runAfterInteractionOrLoadDelay(callback, 1500);

  window.dispatchEvent(new Event("load"));
  jest.advanceTimersByTime(1499);
  expect(callback).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(1);
  cleanup();
});

test("starts core analytics immediately on the first interaction", () => {
  jest.useFakeTimers();
  const callback = jest.fn();
  const cleanup = runAfterInteractionOrLoadDelay(callback, 1500);

  window.dispatchEvent(new Event("pointerdown"));
  expect(callback).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(2000);
  expect(callback).toHaveBeenCalledTimes(1);
  cleanup();
});

test("does not start an interaction-only enhancement for a passive visit", () => {
  jest.useFakeTimers();
  const callback = jest.fn();
  const cleanup = runAfterFirstInteraction(callback);

  window.dispatchEvent(new Event("load"));
  jest.advanceTimersByTime(30000);
  expect(callback).not.toHaveBeenCalled();

  window.dispatchEvent(new Event("touchstart"));
  expect(callback).toHaveBeenCalledTimes(1);
  cleanup();
});
