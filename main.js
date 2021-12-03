// Initialization
let render_btn = document.getElementById("render_btn");

let RENDER_CELLS_AMOUNT_LIMIT = 18000;
let MAX_MARCHING_STEPS = 200;
let MAX_VIEW_DISTANCE = 500;
let EPSILON = 0.01;

let canvasContainer = document.querySelector(".canvas-container");
let view = document.getElementById("view");
let ctx = view.getContext("2d", { alpha: false });

let axes_canvas = document.getElementById("axes");
let ctx_axes = axes_canvas.getContext("2d");

let camera = {
  position: { x: -15, y: -20, z: -30 },
  rotation: { x: -20, y: 30, z: 25 },
};

let objects = [
  // {
  // 	position: {x: 5, y: 15, z: 60},
  // 	rotation: {x: 0, y: 0, z: 0},
  // 	r: 8,
  // 	function: function (x, y, z) { // sdf - sphere
  // 		return Math.sqrt(
  // 			Math.pow(x, 2) +
  // 			Math.pow(y, 2) +
  // 			Math.pow(z, 2)
  // 		) - this.r
  // 	}
  // },
  // {
  //   position: { x: 0, y: 0, z: 0 },
  //   rotation: { x: 0, y: 0, z: 0 },
  //   side: 10,
  //   function: function (x, y, z) {
  //     // sdf - cube
  //     return Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) - this.side / 2;
  //   },
  // },
  {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 20,
    function: function (x, y, z) {
      // sdf - teapot
      return Math.min(
        Math.sqrt(x ** 2 + (y - 0.27 * this.scale) ** 2 + z ** 2) -
          0.05 * this.scale,
        Math.sqrt(x ** 2 + 2.5 * y ** 2 + z ** 2) - 0.4 * this.scale,
        Math.sqrt(
          (Math.sqrt(x ** 2 + z ** 2) - 0.3 * this.scale) ** 2 +
            (y - 0.18 * this.scale) ** 2
        ) -
          0.02 * this.scale,
        Math.max(
          1.15 * x + y - 0.75 * this.scale,
          -y + 0.09 * this.scale,
          Math.sqrt(
            (Math.sqrt(
              (x - 0.55 * this.scale) ** 2 + (y - 0.09 * this.scale) ** 2
            ) -
              0.1 * this.scale) **
              2 +
              (z - 0.1 * this.scale) ** 2
          ) -
            0.04 * this.scale
        ),
        Math.max(
          -(-y + 0.09 * this.scale),
          Math.sqrt(
            (Math.sqrt(
              (x - 0.35 * this.scale) ** 2 + (y - 0.09 * this.scale) ** 2
            ) -
              0.1 * this.scale) **
              2 +
              (z - 0.1 * this.scale) ** 2
          ) -
            0.04 * this.scale
        )
      );
    },
  },
];

/**
 * Signed Distance Function
 *
 * It gets object and coordinates of ray of light
 * and returns distance to the object
 *
 * obj: object with personal SDF function inside
 * x, y, z: coordinates of the ray of light
 */
function SDF(obj, x, y, z) {
  return obj.function(
    obj.position.x - x,
    obj.position.y - y,
    obj.position.z - z
  );
}

/**
 * Returns the shortest SDF all objects
 *
 * x, y, z: coordinates of the ray of light
 */
function minSDF(x, y, z) {
  let min_dist = SDF(objects[0], x, y, z);

  objects.forEach(function (obj) {
    min_dist = Math.min(min_dist, SDF(obj, x, y, z));
  });

  return min_dist;
}

/**
 * Return the normalized direction to march in from the eye point for a single pixel.
 *
 * fieldOfView: vertical field of view in degrees
 * screenWidth, screenHeight: resolution of the screen
 * pixelCordX, pixelCordY: the x, y coordinate of the pixel on the screen
 * rotationX, rotationY, rotationZ: the x, y, z
 */
function rayDirection(
  fieldOfView,
  screenWidth,
  screenHeight,
  pixelCordX,
  pixelCordY,
  rotationX,
  rotationY,
  rotationZ
) {
  let x = pixelCordX - screenWidth / 2;
  let y = pixelCordY - screenHeight / 2;
  let z = screenHeight / Math.tan(Math.radians(fieldOfView) / 2.0);

  // Rotation around the X axis
  y = y * Math.cos(rotationX) + z * -Math.sin(rotationX);
  z = y * Math.sin(rotationX) + z * Math.cos(rotationX);

  // Rotation around the Y axis
  x = x * Math.cos(rotationY) + z * Math.sin(rotationY);
  z = x * -Math.sin(rotationY) + z * Math.cos(rotationY);

  // Rotation around the Z axis
  x = x * Math.cos(rotationZ) + y * -Math.sin(rotationZ);
  y = x * Math.sin(rotationZ) + y * Math.cos(rotationZ);

  return Math.normalize(x, y, z);
}

/**
 * Return the ray length
 *
 * ro: ray origin
 * rd: ray direction
 */
function rayMarch(ro, rd) {
  let depth = 0;

  for (let i = 0; i < MAX_MARCHING_STEPS; i++) {
    let ray_x = ro.x + depth * rd.x;
    let ray_y = ro.y + depth * rd.y;
    let ray_z = ro.z + depth * rd.z;

    let dist = minSDF(ray_x, ray_y, ray_z);

    depth += dist;

    if (dist < EPSILON || depth > MAX_VIEW_DISTANCE) {
      break;
    }
  }

  return depth;
}

function getNormal(x, y, z) {
  return Math.normalize(
    minSDF(x + EPSILON, y, z) - minSDF(x - EPSILON, y, z),
    minSDF(x, y + EPSILON, z) - minSDF(x, y - EPSILON, z),
    minSDF(x, y, z + EPSILON) - minSDF(x, y, z - EPSILON)
  );
}

/**
 * Calculates color using Phong shading
 */
function getPhongColor(normal, rd) {
  let cos_between_vec =
    (normal.x * rd.x + normal.y * rd.y + normal.z * rd.z) /
    Math.sqrt(
      (normal.x ** 2 + normal.y ** 2 + normal.z ** 2) *
        (rd.x ** 2 + rd.y ** 2 + rd.z ** 2)
    );

  return Math.max(-cos_between_vec * 255, 0);
}

function drawAxes(rot_x, rot_y, rot_z) {
  ctx_axes.clearRect(0, 0, axes_canvas.width, axes_canvas.width);

  let d = axes_canvas.width;
  let size = axes_canvas.width;

  let x_x =
    Math.cos(Math.radians(rot_y + 180)) * Math.cos(Math.radians(-rot_z)); // 1
  let x_y = Math.sin(Math.radians(-rot_z)); // 0
  let x_z = -Math.sin(Math.radians(rot_y)); // 0

  x_x = x_x * size;
  x_y = x_y * size;
  x_z = x_z * size + size;

  x_x = size / 2 + (x_x * d) / (x_z + d);
  x_y = size / 2 - (x_y * d) / (x_z + d);

  let y_x = Math.sin(Math.radians(-rot_z)); // 0
  let y_y = Math.cos(Math.radians(rot_x)) * Math.cos(Math.radians(-rot_z)); // 1
  let y_z = -Math.sin(Math.radians(rot_x)); // 0

  y_x = y_x * size;
  y_y = y_y * size;
  y_z = y_z * size + size;

  y_x = size / 2 + (y_x * d) / (y_z + d);
  y_y = size / 2 - (y_y * d) / (y_z + d);

  let z_x = Math.sin(Math.radians(rot_y)); // 0
  let z_y = Math.sin(Math.radians(rot_x)); // 0
  let z_z = Math.cos(Math.radians(rot_x)) * Math.cos(Math.radians(rot_y)); // 1

  z_x = z_x * size;
  z_y = z_y * size;
  z_z = z_z * size + size;

  z_x = size / 2 + (z_x * d) / (z_z + d);
  z_y = size / 2 - (z_y * d) / (z_z + d);

  // X
  ctx_axes.beginPath();
  ctx_axes.moveTo(size / 2, size / 2);
  ctx_axes.lineTo(x_x, x_y);
  ctx_axes.lineWidth = 4;
  ctx_axes.strokeStyle = "#e60000";
  ctx_axes.stroke();

  // Y
  ctx_axes.beginPath();
  ctx_axes.moveTo(size / 2, size / 2);
  ctx_axes.lineTo(y_x, y_y);
  ctx_axes.lineWidth = 4;
  ctx_axes.strokeStyle = "#26e600";
  ctx_axes.stroke();

  // Z
  ctx_axes.beginPath();
  ctx_axes.moveTo(size / 2, size / 2);
  ctx_axes.lineTo(z_x, z_y);
  ctx_axes.lineWidth = 4;
  ctx_axes.strokeStyle = "#0026e6";
  ctx_axes.stroke();

  // Center
  ctx_axes.beginPath();
  ctx_axes.ellipse(size / 2, size / 2, 3, 3, 0, 0, 2 * Math.PI);
  ctx_axes.fillStyle = "#fff";
  ctx_axes.fill();
}

function syncSettings() {
  let camera_position_x = document.getElementById("camera_position_x");
  let camera_position_y = document.getElementById("camera_position_y");
  let camera_position_z = document.getElementById("camera_position_z");

  let camera_rotation_x = document.getElementById("camera_rotation_x");
  let camera_rotation_y = document.getElementById("camera_rotation_y");
  let camera_rotation_z = document.getElementById("camera_rotation_z");

  let marching_epsilon = document.getElementById("marching_epsilon");
  let max_view_distance = document.getElementById("max_view_distance");
  let max_marching_steps = document.getElementById("max_marching_steps");

  camera.position.x = parseFloat(camera_position_x.value);
  camera.position.y = parseFloat(camera_position_y.value);
  camera.position.z = parseFloat(camera_position_z.value);

  camera.rotation.x = parseFloat(camera_rotation_x.value);
  camera.rotation.y = parseFloat(camera_rotation_y.value);
  camera.rotation.z = parseFloat(camera_rotation_z.value);

  EPSILON = parseFloat(marching_epsilon.value);
  MAX_VIEW_DISTANCE = parseInt(max_view_distance.value);
  MAX_MARCHING_STEPS = parseInt(max_marching_steps.value);

  drawAxes(camera.rotation.x, camera.rotation.y, camera.rotation.z);
}

function getPixelColor(view, camera, x, y) {
  let rd = rayDirection(
    60,
    view.width,
    view.height,
    x,
    y,
    Math.radians(camera.rotation.x),
    Math.radians(camera.rotation.y),
    Math.radians(camera.rotation.z)
  );
  let rm = rayMarch(camera.position, rd);

  let normal = getNormal(
    camera.position.x + rd.x * rm,
    camera.position.y + rd.y * rm,
    camera.position.z + rd.z * rm
  );

  let color = getPhongColor(normal, rd);

  return {
    r: color,
    g: color,
    b: color,
  };
}

let currentRenderTimeout;
function render(view, camera, scale) {
  if (currentRenderTimeout) {
    clearTimeout(currentRenderTimeout);
  }

  function renderScreen(view, camera, scale, cellSize, i = 0) {
    const cellsInWidth = Math.ceil(view.width / cellSize);
    const cellsInHeight = Math.ceil(view.height / cellSize);
    const pixelXInCell = (i * scale) % cellSize;
    const pixelYInCell = Math.floor((i * scale) / cellSize) * scale;

    for (let cellX = 0; cellX <= cellsInWidth; cellX++) {
      let pixelX = cellSize * cellX + pixelXInCell;

      if (pixelX >= view.width) {
        break;
      }

      for (let cellY = 0; cellY <= cellsInHeight; cellY++) {
        let pixelY = cellSize * cellY + pixelYInCell;

        if (pixelY >= view.height) {
          break;
        }

        let color = getPixelColor(view, camera, pixelX, pixelY);
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillRect(pixelX, pixelY, scale, scale);
      }
    }

    if (i < (cellSize / scale) ** 2) {
      currentRenderTimeout = setTimeout(
        () => renderScreen(view, camera, scale, cellSize, i + 1),
        0
      );
    }
  }

  let cellSize = (view.width * view.height) / RENDER_CELLS_AMOUNT_LIMIT;
  cellSize = Math.ceil(cellSize / scale) * scale;

  renderScreen(view, camera, scale, cellSize);
}

render_btn.addEventListener("click", () => {
  syncSettings();
  render(
    view,
    camera,
    parseFloat(document.getElementById("render_quality").value)
  );
});

function renderPreview() {
  syncSettings();
  render(
    view,
    camera,
    parseFloat(document.getElementById("preview_quality").value)
  );
}

function initCanvas() {
  view.width = canvasContainer.clientWidth;
  view.height = canvasContainer.clientHeight;
  renderPreview();
}

const debouncedCanvasInit = debounce(initCanvas, 100);

window.addEventListener("resize", debouncedCanvasInit);
window.addEventListener("load", debouncedCanvasInit);

/**
 * Shows information about pixel, when you click on it
 */
view.onclick = function (e) {
  let i = e.clientX;
  let j = e.clientY;

  let rd = rayDirection(
    60,
    view.width,
    view.height,
    i,
    j,
    Math.radians(camera.rotation.x),
    Math.radians(camera.rotation.y),
    Math.radians(camera.rotation.z)
  );
  let rm = rayMarch(camera.position, rd);

  let normal = getNormal(
    camera.position.x + rd.x * rm,
    camera.position.y + rd.y * rm,
    camera.position.z + rd.z * rm
  );

  let color = getPhongColor(normal, rd);

  console.table({
    'Color': Math.round(color),
    'Normal X': Math.round(normal.x * 1000) / 1000,
    'Normal Y': Math.round(normal.y * 1000) / 1000,
    'Normal Z': Math.round(normal.z * 1000) / 1000,
    'Ray march': Math.round(rm * 100) / 100,
    'Ray direction X': Math.round(rd.x * 1000) / 100,
    'Ray direction Y': Math.round(rd.y * 1000) / 100,
    'Ray direction Z': Math.round(rd.z * 1000) / 100,
  })
};
