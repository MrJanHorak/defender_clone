// constants
// const WORLD_WIDTH = 10000;
// const worldWidth = 10000;
const VIEW_PORT = 800;

const scrollSpeed = 25;
const mouse = { leftPressed: false, rightPressed: false };
const keys = {};

window.addEventListener('keydown', (e) => handleKeyEvent(e));
window.addEventListener('keyup', (e) => handleKeyEvent(e));

window.addEventListener('click', (e) => {
  console.log(e.button);
  if (e.button === 0) fireLaser();
  if (e.button === 1) mouse.middlePressed = true;
  if (e.button === 2) mouse.rightPressed = true;
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouse.leftPressed = false;
  if (e.button === 1) mouse.middlePressed = false;
  if (e.button === 2) mouse.rightPressed = false;
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

// variables
let scrollX = 0;
// Game States
let menu, playing, Level_complete, player_death, game_over;

// Player Stats
let score, lives, smart_bombs, active_level;

// Player Ship stats
let facing = 1; // 1 for right -1 for left
let velocity = 0;
let accelRate = 0.08;
let decelRate = 0.04;
let maxVelocity = 25;
let shipMaxYposition = 1375;
let shipMinYposition = -12;
let shipYposition = (shipMaxYposition - shipMinYposition) / 2;
let radarShipMinYposition = 0;
let radarShipMaxYposition = 127;
let radarShipMaxXposition = 700;
let radarShipMinXposition = 0;
let radarShipYposition = (radarShipMaxYposition - radarShipMinYposition) / 2;

const lasers = [];

//DOM elements
const containers = document.getElementsByClassName('container');
const body = document.querySelector('body');

const radarContainer = document.createElement('div');
radarContainer.id = 'radarContainer';
document.body.appendChild(radarContainer);

const radar = document.createElement('canvas');
radar.id = 'radar';
radarContainer.appendChild(radar);

const radarShipCanvas = document.createElement('canvas');
radarShipCanvas.className = 'radarShipField';
radarContainer.appendChild(radarShipCanvas);

// Sync internal canvas resolutions to DOM rendering sizes
radar.width = radarContainer.clientWidth;
radar.height = radarContainer.clientHeight;

radarShipCanvas.width = radarContainer.clientWidth;
radarShipCanvas.height = radarContainer.clientHeight;

const ctx = radar.getContext('2d');
const radarShipCTX = radarShipCanvas.getContext('2d');

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

const shipCanvas = document.createElement('canvas');
shipCanvas.className = 'shipField';
viewport.appendChild(shipCanvas);
shipCanvas.width = shipCanvas.clientWidth;
shipCanvas.height = shipCanvas.clientHeight;

const shipCtx = shipCanvas.getContext('2d');

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

  [ctx2, ctx3].forEach((c) => {
    c.strokeStyle = 'red';
    c.lineWidth = 3;
    c.lineCap = 'square';
    c.lineJoin = 'round';
    c.beginPath();
  });

  ctx.strokeStyle = 'red';
  ctx.lineWidth = 1;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  // Calculate aspect ratios for proportional scaling
  const radarYScale = radar.height / gameField.height;

  points.forEach((point, index) => {
    const rawX = parseFloat(point[0]);
    const rawY = parseFloat(point[1]);

    // Main game field positions (unscaled world coords)
    const canvas2X = (rawX / 100) * gameField.width;
    const canvas2Y = (rawY / 100) * gameField.height;

    // Radar positions (X scales to radar width, Y scales proportionally to gameField height)
    const canvasX = (rawX / 100) * radar.width;
    const canvasY = canvas2Y * radarYScale;

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

const handleKeyEvent = (e) => {
  keys[e.key] = {
    isPressed: e.type === 'keydown',
    type: e.type,
  };
};

const speedingUp = () => {
  if (facing === 1) {
    velocity = Math.min(maxVelocity, velocity + accelRate);
  } else {
    velocity = Math.max(-maxVelocity, velocity - accelRate);
  }
};

const coasting = () => {
  if (velocity > 0) {
    velocity = Math.max(0.0, velocity - decelRate);
  } else {
    velocity = Math.min(0.0, velocity + decelRate);
  }
};

const reverse = () => {
  facing = -facing;
  velocity = -velocity;
};

// const placeShip = () => {
//   const shipSprite = new Image();
//   shipSprite.src = 'assets/Spaceship (1).png';

//   shipSprite.onload = function () {
//     const x = (shipCanvas.width - 150) / 2;
//     const y = (shipCanvas.height - 70) / 2;

//     shipCtx.drawImage(shipSprite, x, y, 150, 70);
//   };
// };

const drawRadarViewportBox = () => {
  const visibleWidthRatio = viewport.clientWidth / worldWidth;
  const boxWidth = radar.width * visibleWidthRatio;
  const boxX = (scrollX / worldWidth) * radar.width;

  radarShipCTX.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  radarShipCTX.lineWidth = 1;
  facing === 1 ?
  radarShipCTX.strokeRect(boxX, 0, boxWidth, radar.height):
  radarShipCTX.strokeRect(boxX, 0, boxWidth, radar.height)
};

const moveShip = () => {
  const shipSprite = new Image();
  shipSprite.src = 'assets/Spaceship (1).png';

  shipSprite.onload = function () {
    const x = (shipCanvas.width - 150) / 2;
    const y = shipYposition;

    if (facing === -1) {
      shipCtx.save();
      shipCtx.clearRect(0, 0, shipCanvas.width, shipCanvas.height);
      shipCtx.translate(x + 650, y);
      shipCtx.scale(-1, 1);
      shipCtx.drawImage(shipSprite, 0, 0, 150, 70);
      shipCtx.restore();
    } else {
      shipCtx.save();
      shipCtx.clearRect(0, 0, shipCanvas.width, shipCanvas.height);
      shipCtx.drawImage(shipSprite, x-650, y, 150, 70);
      shipCtx.restore();
    }
  };
};

const moveShipRadar = () => {
  const playerSprite = new Image();
  playerSprite.src = 'assets/Spaceship (1).png';

  playerSprite.onload = function () {
    const x = (scrollX / worldWidth) * radar.width + 45;
    const y = radarShipYposition;

    radarShipCTX.clearRect(0, 0, radarShipCanvas.width, radarShipCanvas.height);

    if (facing === -1) {
      radarShipCTX.save();
      radarShipCTX.translate(x + 30 +50, y);
      radarShipCTX.scale(-1, 1);
      radarShipCTX.drawImage(playerSprite, 0, 0, 30, 15);
      radarShipCTX.restore();
    } else {
      radarShipCTX.save();
      radarShipCTX.drawImage(playerSprite, x, y, 30, 15);
      radarShipCTX.restore();
    }
  };
  drawRadarViewportBox();
};

const fireLaser = () => {
  lasers.push({
    startX: shipCanvas.width / 2 + 58,
    startY: shipYposition + 37,
    length: 1000,
    timer: 1000,
    speed: 50,
  });
};

const drawDefenderLaser = (startX, startY, laserLength) => {
  console.log('phew phew ... firing lasr --------- ZAP!');
  // const laserLength = 800;
  const segmentLength = 20;
  const colors = [
    '#FF0000',
    '#00FF00',
    '#00FFFF',
    '#FFFF00',
    '#FF00FF',
    '#FFFFFF',
    '#000000',
  ];

  // let startX = shipCanvas.width / 2 + 58;
  let endX;

  shipCtx.lineWidth = 4;
  facing === 1
    ? (startX = ((shipCanvas.width / 2 + 58)-650))
    : (startX = ((shipCanvas.width / 2 - 58)+500));

  for (let i = lasers.length - 1; i >= 0; i--) {
    let laser = lasers[i];
    for (let x = 0; x < laserLength; x += segmentLength) {
      shipCtx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];

      shipCtx.beginPath();
      if (facing === 1) {
        shipCtx.moveTo(startX + x, startY);
        endX = Math.min(startX + x + segmentLength, startX + laserLength);
      } else {
        shipCtx.moveTo(startX - x, startY);
        endX = Math.min(startX - x - segmentLength, startX - laserLength);
      }
      laser.timer--;

      if (laser.timer <= 0) {
        lasers.splice(i, 1);
        continue;
      }
      shipCtx.lineTo(endX, startY);
      shipCtx.stroke();
    }
  }
};

const updateAndDrawLasers = () => {
  for (let i = lasers.length - 1; i >= 0; i--) {
    let laser = lasers[i];

    // laser.startX += laser.speed;

    laser.timer--;

    if (laser.timer <= 0) {
      lasers.splice(i, 1);
      continue;
    }
    drawDefenderLaser(laser.startX, laser.startY, laser.length);
  }
};

const deployBomb = () => {
  console.log('BOOOOM bomb used');
};

const activateWarp = () => {
  console.log('Engage!');
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

  if ((keys['ArrowUp'] || keys['w']) && keys['ArrowUp'].isPressed) {
    shipYposition = Math.max(-12, shipYposition - 14);
    radarShipYposition = Math.max(
      radarShipMinYposition,
      radarShipYposition - 1.4,
    );
  }

  if ((keys['ArrowDown'] || keys['s']) && keys['ArrowDown'].isPressed) {
    shipYposition = Math.min(shipMaxYposition, shipYposition + 14);
    radarShipYposition = Math.min(
      radarShipMaxYposition,
      radarShipYposition + 1.4,
    );
  }

  if (keys['Space'] || mouse.leftPressed) {
    fireLaser();
  }

  if (keys['Ctrl'] || mouse.rightPressed) {
    deployBomb();
  }

  if (keys['z'] || mouse.middlePressed) {
    activateWarp();
  }

  if (scrollX >= worldWidth) {
    scrollX -= worldWidth;
  } else if (scrollX < 0) {
    scrollX += worldWidth;
  }

  canvasStrip.style.transform = `translateX(${-scrollX}px)`;
  moveShip();
  moveShipRadar();
  updateAndDrawLasers();
  requestAnimationFrame(gameLoop);
}

// Run terrain generation
generate_terrain(containers, 0, 70, 100, 70, 2.5, 35);
// placeShip();
gameLoop();
