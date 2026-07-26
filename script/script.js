// constants
// const WORLD_WIDTH = 10000;
// const worldWidth = 10000;
const VIEW_PORT = 800;

const scrollSpeed = 25;

const keys = {};
window.addEventListener('keydown', (e) => handleKeyEvent(e));
window.addEventListener('keyup', (e) => handleKeyEvent(e));

// variables
let scrollX = 0;
// Game States
let menu, playing, Level_complete, player_death, game_over;

// Player Stats
let score, lives, smart_bombs, active_level;

// Player Ship stats
let facing = 1; // 1 for right -1 for left
let velocity = 0; // max is 2 frames per second.
let accelRate = 0.08;
let decelRate = 0.04;
let maxVelocity = 25;

//DOM elements
const containers = document.getElementsByClassName('container');
const body = document.querySelector('body');

const radar = document.createElement('canvas');
document.body.appendChild(radar);
radar.id = 'radar';
radar.style.width = '80rem';
radar.style.height = '12rem';
radar.style.border = '1px solid grey';

radar.width = radar.clientWidth;
radar.height = radar.clientHeight;
const ctx = radar.getContext('2d');

// --- Viewport & GameField Canvas Setup ---
const viewport = document.createElement('div');
viewport.className = 'viewport-window';
document.body.appendChild(viewport);

const canvasStrip = document.createElement('div');
canvasStrip.id = 'canvas-strip';
viewport.appendChild(canvasStrip);

const gameField = document.createElement('canvas');
gameField.className = 'game-panel';
canvasStrip.appendChild(gameField);

const gameFieldClone = document.createElement('canvas');
gameFieldClone.className = 'game-panel';
canvasStrip.appendChild(gameFieldClone);

gameField.width = gameField.clientWidth;
gameField.height = gameField.clientHeight;
gameFieldClone.width = gameFieldClone.clientWidth;
gameFieldClone.height = gameFieldClone.clientHeight;

const ctx2 = gameField.getContext('2d');
const ctx3 = gameFieldClone.getContext('2d');

const worldWidth = gameField.width;
// functions
const generate_terrain = (
  parentNodes,
  x1,
  y1,
  x2,
  y2,
  segmentLength = 10,
  jagginess = 15,
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const perpAngle = angle + Math.PI / 2;
  const totalSegments = Math.max(1, Math.floor(distance / segmentLength));

  const points = [[`${x1}`, `${y1}`]];

  for (let i = 1; i < totalSegments; i++) {
    const t = i / totalSegments;
    const baseX = x1 + dx * t;
    const baseY = y1 + dy * t;
    const offset = (Math.random() - 0.5) * jagginess;
    const jagX = baseX + Math.cos(perpAngle) * offset;
    const jagY = baseY + Math.sin(perpAngle) * offset;
    points.push([`${jagX.toFixed(1)}`, `${jagY.toFixed(1)}`]);
  }
  points.push([`${x2}`, `${y2}`]);
  const pointsString = points.join(' ');

  [ctx, ctx2, ctx3].forEach((c) => {
    c.strokeStyle = 'red';
    c.lineWidth = 2;
    c.lineCap = 'square';
    c.lineJoin = 'round';
    c.beginPath();
  });

  points.forEach((point, index) => {
    const rawX = parseFloat(point[0]);
    const rawY = parseFloat(point[1]);

    const canvasX = (rawX / 100) * radar.width;
    const canvasY = (rawY / 100) * radar.height;
    const canvas2X = (rawX / 100) * gameField.width;
    const canvas2Y = (rawY / 100) * gameField.height;

    if (index === 0) {
      ctx.moveTo(canvasX, canvasY);
      ctx2.moveTo(canvas2X, canvas2Y);
      ctx3.moveTo(canvas2X, canvas2Y);
    } else {
      ctx.lineTo(canvasX, canvasY);
      ctx2.lineTo(canvas2X, canvas2Y);
      ctx3.lineTo(canvas2X, canvas2Y);
    }
  });

  ctx.stroke();
  ctx2.stroke();
  ctx3.stroke();
};

// --- CAMERA & SCROLLING CONTROLS ---
function gameLoop() {
  if ((keys['ArrowRight'] || keys['d']) && keys['ArrowRight'].isPressed) {
    if (facing !== 1) {
      reverse();
    }
    speedingUp();
    // scrollX += scrollSpeed;
    scrollX += velocity;
  } else if (
    (keys['ArrowRight'] || keys['d']) &&
    !keys['ArrowRight'].isPressed
  ) {
    coasting();
    scrollX += velocity;
  }

  if ((keys['ArrowLeft'] || keys['a']) && keys['ArrowLeft'].isPressed) {
    if (facing !== -1) {
      reverse();
    }
    speedingUp();
    // scrollX -= scrollSpeed;
    scrollX += velocity;
  } else if ((keys['ArrowLeft'] || keys['a']) && !keys['ArrowLeft'].isPressed) {
    coasting();
    // scrollX -= scrollSpeed;
    scrollX += velocity;
  }

  if (scrollX >= worldWidth) {
    scrollX -= worldWidth;
  } else if (scrollX < 0) {
    scrollX += worldWidth;
  }

  canvasStrip.style.transform = `translateX(${-scrollX}px)`;

  requestAnimationFrame(gameLoop);
}

function handleKeyEvent(e) {
  keys[e.key] = {
    isPressed: e.type === 'keydown',
    type: e.type,
  };
}

function speedingUp() {
  if (facing === 1) {
    velocity = Math.min(maxVelocity, velocity + accelRate);
  } else {
    velocity = Math.max(-maxVelocity, velocity - accelRate);
    // velocity = Math.max(maxVelocity, velocity + accelRate);
  }
}

function coasting() {
  if (velocity > 0) {
    velocity = Math.max(0.0, velocity - decelRate);
  } else {
    velocity = Math.min(0.0, velocity + decelRate);
  }
}

function reverse() {
  facing = -facing;
  velocity = -velocity;
}

// Run terrain generation
generate_terrain(containers, 0, 70, 100, 70, 2.5, 35);
gameLoop();
