window.radians = function (degrees) {
  return (degrees * Math.PI) / 180;
};

window.degrees = function (radians) {
  return (radians * 180) / Math.PI;
};

window.normalize = function (x, y, z) {
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

// https://gist.github.com/fernandozamoraj/d22d10fa9853f777c6744ccbf0d12cd8
window.multiplyMatrix = (A, B) => {
  let aRows = A.length;
  let aCols = A[0].length;
  let bCols = B[0].length;
  let C = [];
  let i = 0;
  let j = 0;

  for (i = 0; i < aRows; i++) {
    C.push([]);
    for (j = 0; j < bCols; j++) {
      C[i].push(0);
    }
  }

  for (a = 0; a < bCols; a++) {
    for (i = 0; i < aRows; i++) {
      let sum = 0;
      for (j = 0; j < aCols; j++) {
        sum += A[i][j] * B[j][a];
      }

      C[i][a] = sum;
    }
  }

  return C;
}
