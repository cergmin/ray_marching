Math.radians = function (degrees) {
  return (degrees * Math.PI) / 180;
};

Math.degrees = function (radians) {
  return (radians * 180) / Math.PI;
};

Math.normalize = function (x, y, z) {
  return {
    x: x / Math.sqrt(x ** 2 + y ** 2 + z ** 2),
    y: y / Math.sqrt(x ** 2 + y ** 2 + z ** 2),
    z: z / Math.sqrt(x ** 2 + y ** 2 + z ** 2),
  };
};

// https://gist.github.com/nmsdvid/8807205#gistcomment-3205518
window.debounce = (callback, delay = 250) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback(...args);
    }, delay);
  };
};
