window.requestIdleCallback = window.requestIdleCallback || function(callback) {
  const start = Date.now();

  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => {
        return Math.max(0, 50 - (Date.now() - start));
      }
    })
  }, 1);
}

window.cancelIdleCallback = function(id) {
  clearTimeout(id);
}