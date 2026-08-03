// --- CONFIGURATION CONSTANTS ---
const VIEW_PORT = 800;
const LOOK_AHEAD_DISTANCE = 650;

// Preload assets once
const shipSprite = new Image();
shipSprite.src = 'assets/Spaceship (1).png';

const humanoidSprite = new Image();
humanoidSprite.src = 'assets/astronaut_spritesheet.png';

class InputHandler {
  constructor() {
    this.keys = {};
    this.mouse = {
      leftPressed: false,
      middlePressed: false,
      rightPressed: false,
    };

    window.addEventListener('keydown', (e) => (this.keys[e.key] = true));
    window.addEventListener('keyup', (e) => (this.keys[e.key] = false));

    window.addEventListener('click', (e) => {
      if (e.button === 1) this.mouse.middlePressed = true;
      if (e.button === 2) this.mouse.rightPressed = true;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.leftPressed = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftPressed = false;
      if (e.button === 1) this.mouse.middlePressed = false;
      if (e.button === 2) this.mouse.rightPressed = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isMovingRight() {
    return this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'];
  }

  isMovingLeft() {
    return this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'];
  }

  isMovingUp() {
    return this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'];
  }

  isMovingDown() {
    return this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'];
  }

  isFiring() {
    return this.keys[' '] || this.mouse.leftPressed;
  }

  isDeployingBomb() {
    return this.keys['Control'] || this.mouse.rightPressed;
  }

  isActivatingWarp() {
    return this.keys['z'] || this.keys['Z'] || this.mouse.middlePressed;
  }
}

class PlayerShip {
  constructor() {
    this.facing = 1; // 1 for right, -1 for left
    this.velocity = 0;
    this.accelRate = 0.08;
    this.decelRate = 0.04;
    this.maxVelocity = 25;

    // Y-Axis Bounds & Position
    this.minY = -12;
    this.maxY = 1375;
    this.y = (this.maxY - this.minY) / 2;

    // Radar Bounds & Position
    this.radarMinY = 0;
    this.radarMaxY = 127;
    this.radarY = (this.radarMaxY - this.radarMinY) / 2;

    // Stats
    this.lives = 3;
    this.smartBombs = 3;
    this.hyperSpace = 3;
  }

  speedUp() {
    if (this.facing === 1) {
      this.velocity = Math.min(
        this.maxVelocity,
        this.velocity + this.accelRate,
      );
    } else {
      this.velocity = Math.max(
        -this.maxVelocity,
        this.velocity - this.accelRate,
      );
    }
  }

  coast() {
    if (this.velocity > 0) {
      this.velocity = Math.max(0, this.velocity - this.decelRate);
    } else {
      this.velocity = Math.min(0, this.velocity + this.decelRate);
    }
  }

  reverse() {
    this.facing = -this.facing;
    this.velocity = -this.velocity;
  }

  moveUp() {
    this.y = Math.max(this.minY, this.y - 14);
    this.radarY = Math.max(this.radarMinY, this.radarY - 1.4);
  }

  moveDown() {
    this.y = Math.min(this.maxY, this.y + 14);
    this.radarY = Math.min(this.radarMaxY, this.radarY + 1.4);
  }

  getNosePosition(canvasWidth, cameraOffsetX) {
    const screenCenterX = canvasWidth / 2;
    const shipRenderX = screenCenterX - 75 - cameraOffsetX;
    const noseX = this.facing === 1 ? shipRenderX + 150 : shipRenderX;
    const noseY = this.y + 35;
    return { x: noseX, y: noseY };
  }

  deployBomb() {
    if (this.smartBombs > 0) {
      this.smartBombs--;
      console.log('BOOOOM bomb used! Remaining:', this.smartBombs);
      return true;
    }
    return false;
  }

  activateWarp() {
    if (this.hyperSpace > 0) {
      this.hyperSpace--;
      console.log('Engage Hyperspace! Remaining:', this.hyperSpace);
      return true;
    }
    return false;
  }
}

class Laser {
  constructor(startX, startY, facing) {
    this.startX = startX;
    this.startY = startY;
    this.facing = facing;
    this.length = 1500;
    this.timer = 40;
    this.segmentLength = 30;
    this.colors = [
      '#FF0000',
      '#00FF00',
      '#00FFFF',
      '#FFFF00',
      '#FF00FF',
      '#FFFFFF',
    ];
  }

  update() {
    this.timer--;
    return this.timer > 0;
  }

  draw(ctx) {
    ctx.lineWidth = 4;
    for (let x = 0; x < this.length; x += this.segmentLength) {
      ctx.strokeStyle =
        this.colors[Math.floor(Math.random() * this.colors.length)];
      ctx.beginPath();

      if (this.facing === 1) {
        const segStart = this.startX + x;
        const segEnd = Math.min(
          segStart + this.segmentLength,
          this.startX + this.length,
        );
        ctx.moveTo(segStart, this.startY);
        ctx.lineTo(segEnd, this.startY);
      } else {
        const segStart = this.startX - x;
        const segEnd = Math.max(
          segStart - this.segmentLength,
          this.startX - this.length,
        );
        ctx.moveTo(segStart, this.startY);
        ctx.lineTo(segEnd, this.startY);
      }

      ctx.stroke();
    }
  }
}

class Humanoid {
  constructor(x, groundY) {
    //location
    this.x = x;
    this.groundY = groundY;
    this.y = groundY;
    this.width = 24;
    this.height = 36;

    //human movement and physics
    this.walkSpeed = 0.5;
    this.walkDirection = Math.random() > 0.5 ? 1 : -1;
    this.fallSpeed = 0;
    this.gravity = 0.15;
    this.terminalVelocity = 6;

    this.totalFrames = 6;
    this.currentFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 15;

    //state of human: 'WALKING', 'BEING_ABDUCTED', 'FALLING', 'CARRIED', 'DEAD'
    this.state = 'WALKING';
    this.carrier = null;

    //score in different situations ... Need to do: double check actual arcade scores in WIKI
    this.rescueScore = 500;
    this.catchScore = 500;
    this.dropLandScroe = 500;
  }

  //handle humanoid state

  getAbductedBy(enemy) {
    this.state = 'BEING_ABDUCTED';
    this.carrier = enemy;
  }

  getDropped() {
    this.state = 'FALLING';
    this.carrier = null;
    this.fallSpeed = 1;
  }

  getRescuedBy(ship) {
    this.state = 'CARRIED';
    this.carrier = ship;
  }

  landSafely() {
    this.state = 'WALKING';
    this.y = this.groundY;
    this.fallSpeed = 0;
    this.carrier = null;
  }

  die() {
    this.state = 'DEAD';
    this.carrier = null;
  }

  // helper function for collision detection
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  update(worldWidth, getTerrainYAt) {
    switch (this.state) {
      case 'WALKING':
        // default humanoid behavior is pacing back and forth because that is what we all do when we are under attack :-)
        this.x += this.walkSpeed * this.walkDirection;
        this.x = ((this.x % worldWidth) + worldWidth) % worldWidth;

        if (getTerrainYAt) {
          const surfaceY = getTerrainYAt(this.x);
          this.groundY = surfaceY - this.height;
          this.y = this.groundY;
        }

        this.animTimer++;
        if (this.animTimer >= this.animSpeed) {
          this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
          this.animTimer = 0;
        }

        if (Math.random() < 0.002) {
          this.walkDirection *= -1;
        }
        break;

      case 'BEING_ABDUCTED':
        if (this.carrier) {
          this.x = this.carrier.x;
          this.y = this.carrier.y + this.carrier.height;
        } else {
          this.getDropped();
        }
        break;

      case 'FALLING':
        this.fallSpeed = Math.min(
          this.terminalVelocity,
          this.fallSpeed + this.gravity,
        );
        this.y += this.fallSpeed;

        // makesure the humanoid lands when the ground is near at a peak
        if (getTerrainYAt) {
          this.groundY = getTerrainYAt(this.x) - this.height;
        }

        // Fallspeed can be fatal so we need to check for it: 4 and greater is too fast
        if (this.y >= this.groundY) {
          if (this.fallSpeed > 4) {
            this.die();
          } else {
            this.landSafely();
          }
        }
        break;

      case 'CARRIED':
        if (this.carrier) {
          this.x = this.carrier.x;
          this.y = this.carrier.y + 35;

          if (this.y >= this.groundY - 10) {
            this.landSafely();
          }
        }
        break;

      case 'DEAD':
        break;
    }
  }

  draw(ctx, scrollX) {
    if (this.state === 'DEAD' || !humanoidSprite.complete) return;

    const screenX = this.x - scrollX;

    const frameWidth = humanoidSprite.width / this.totalFrames;
    const frameHeight = humanoidSprite.height;

    const sourceX = this.currentFrame * frameWidth;

    ctx.save();

    if (this.walkDirection === -1) {
      ctx.translate(screenX + this.width, this.y);
      ctx.scale(-1, 1);

      ctx.drawImage(
        humanoidSprite,
        sourceX,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        this.width,
        this.height,
      );
    } else {
      ctx.drawImage(
        humanoidSprite,
        sourceX,
        0,
        frameWidth,
        frameHeight,
        screenX,
        this.y,
        this.width,
        this.height,
      );
    }

    ctx.restore();
  }

  drawRadar(radarCtx, radarWidth, worldWidth, radarYScale) {
    if (this.state === 'DEAD') return;

    const radarX = (this.x / worldWidth) * radarWidth;
    const radarY = this.y * radarYScale;

    radarCtx.fillStyle = '#f4f7f4'; //might update to sprite later
    radarCtx.fillRect(radarX, radarY, 4, 8);
  }
}

class Lander {
  constructor() {
    this.alive = true;
    this.humanoidSpotted = true;
    this.abucting = false;
    this.killScore = 250;
  }

  shoot() {
    console.log('zap zap');
  }

  explode() {
    console.log('BOOOOOOM!');
  }

  patrolling() {
    console.log('sweep back and forth');
  }

  descending() {
    console.log('I spy a humanoid I can abduct!');
  }

  ascending() {
    console.log('Trying to reach the top to Mutate!');
  }
}

class Mutant {
  constructor() {
    this.alive = true;
    this.killScore = 250;
  }

  shoot() {
    console.log('zap zap');
  }

  explode() {
    console.log('BOOOOOOM!');
  }

  patrolling() {
    console.log('sweep back and forth');
  }

  descending() {
    console.log('I spy a humanoid I can abduct!');
  }

  ascending() {
    console.log('Trying to reach the top to Mutate!');
  }
}

class Pod {
  constructor() {
    this.alive = true;
    this.killScore = 250;
  }

  shoot() {
    console.log('zap zap');
  }

  explode() {
    console.log('BOOOOOOM!');
  }

  patrolling() {
    console.log('sweep back and forth');
  }

  descending() {
    console.log('I spy a humanoid I can abduct!');
  }

  ascending() {
    console.log('Trying to reach the top to Mutate!');
  }
}

class Swarmer {
  constructor() {
    this.alive = true;
    this.killScore = 250;
  }

  shoot() {
    console.log('zap zap');
  }

  explode() {
    console.log('BOOOOOOM!');
  }

  patrolling() {
    console.log('sweep back and forth');
  }

  descending() {
    console.log('I spy a humanoid I can abduct!');
  }

  ascending() {
    console.log('Trying to reach the top to Mutate!');
  }
}

class Bomber {
  constructor() {
    this.alive = true;
    this.killScore = 250;
  }

  shoot() {
    console.log('zap zap');
  }

  explode() {
    console.log('BOOOOOOM!');
  }

  patrolling() {
    console.log('sweep back and forth');
  }

  descending() {
    console.log('I spy a humanoid I can abduct!');
  }

  ascending() {
    console.log('Trying to reach the top to Mutate!');
  }
}

class Camera {
  constructor(lookAheadDistance, lerpSpeed) {
    this.worldX = 0;
    this.scrollX = 0;
    this.targetOffsetX = lookAheadDistance;
    this.offsetX = lookAheadDistance;
    this.lookAheadDistance = lookAheadDistance;
    this.lerpSpeed = lerpSpeed;
  }

  update(facing, viewportWidth, worldWidth) {
    this.targetOffsetX = facing * this.lookAheadDistance;
    this.offsetX += (this.targetOffsetX - this.offsetX) * this.lerpSpeed;

    let rawScrollX = this.worldX - viewportWidth / 2 + this.offsetX;
    this.scrollX = ((rawScrollX % worldWidth) + worldWidth) % worldWidth;
  }

  move(velocity, worldWidth) {
    this.worldX += velocity;
    this.worldX = ((this.worldX % worldWidth) + worldWidth) % worldWidth;
  }
}

class GameManager {
  constructor() {
    this.input = new InputHandler();
    this.ship = new PlayerShip();
    this.camera = new Camera(LOOK_AHEAD_DISTANCE, 0.02);

    this.totalHumanoids = 10;
    this.lasers = [];
    this.humanoids = [];
    this.landers = [];
    this.mutants = [];
    this.pods = [];
    this.swarmers = [];
    this.bombers = [];

    this.score = 0;
    this.activeLevel = 1;
    this.state = 'PLAYING'; // PLAYING, MENU, GAME_OVER

    this.lastShotTime = 0;
    this.fireRateCooldown = 150; // ms between laser shots

    this.setupDOM();
  }

  setupDOM() {
    // Radar setup
    this.radarContainer = document.createElement('div');
    this.radarContainer.id = 'radarContainer';
    document.body.appendChild(this.radarContainer);

    this.radar = document.createElement('canvas');
    this.radar.id = 'radar';
    this.radarContainer.appendChild(this.radar);

    this.radarShipCanvas = document.createElement('canvas');
    this.radarShipCanvas.className = 'radarShipField';
    this.radarContainer.appendChild(this.radarShipCanvas);

    this.radar.width = this.radarContainer.clientWidth;
    this.radar.height = this.radarContainer.clientHeight;
    this.radarShipCanvas.width = this.radarContainer.clientWidth;
    this.radarShipCanvas.height = this.radarContainer.clientHeight;

    this.radarCtx = this.radar.getContext('2d');
    this.radarShipCtx = this.radarShipCanvas.getContext('2d');

    // Viewport & Game field setup
    this.viewport = document.createElement('div');
    this.viewport.className = 'viewport-window';
    document.body.appendChild(this.viewport);

    this.canvasStrip = document.createElement('div');
    this.canvasStrip.id = 'canvas-strip';
    this.viewport.appendChild(this.canvasStrip);

    this.gameField = document.createElement('canvas');
    this.gameField.className = 'game-panel';
    this.canvasStrip.appendChild(this.gameField);

    this.gameFieldClone = document.createElement('canvas');
    this.gameFieldClone.className = 'game-panel';
    this.canvasStrip.appendChild(this.gameFieldClone);

    this.gameField.width = this.gameField.clientWidth;
    this.gameField.height = this.gameField.clientHeight;
    this.gameFieldClone.width = this.gameFieldClone.clientWidth;
    this.gameFieldClone.height = this.gameFieldClone.clientHeight;

    this.gameFieldCtx1 = this.gameField.getContext('2d');
    this.gameFieldCtx2 = this.gameFieldClone.getContext('2d');

    this.worldWidth = this.gameField.width;

    // Player ship canvas setup
    this.shipCanvas = document.createElement('canvas');
    this.shipCanvas.className = 'shipField';
    this.viewport.appendChild(this.shipCanvas);
    this.shipCanvas.width = this.shipCanvas.clientWidth;
    this.shipCanvas.height = this.shipCanvas.clientHeight;

    this.shipCtx = this.shipCanvas.getContext('2d');
  }

  generateTerrain(x1, y1, x2, y2, segmentLength = 10, jagginess = 15) {
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

    [this.gameFieldCtx1, this.gameFieldCtx2].forEach((c) => {
      c.strokeStyle = 'red';
      c.lineWidth = 3;
      c.lineCap = 'square';
      c.lineJoin = 'round';
      c.beginPath();
    });

    this.radarCtx.strokeStyle = 'red';
    this.radarCtx.lineWidth = 1;
    this.radarCtx.lineCap = 'square';
    this.radarCtx.lineJoin = 'round';
    this.radarCtx.beginPath();

    const radarYScale = this.radar.height / this.gameField.height;

    points.forEach((point, index) => {
      const rawX = parseFloat(point[0]);
      const rawY = parseFloat(point[1]);

      const canvas2X = (rawX / 100) * this.gameField.width;
      const canvas2Y = (rawY / 100) * this.gameField.height;

      const canvasX = (rawX / 100) * this.radar.width;
      const canvasY = canvas2Y * radarYScale;

      if (index === 0) {
        this.radarCtx.moveTo(canvasX, canvasY);
        this.gameFieldCtx1.moveTo(canvas2X, canvas2Y);
        this.gameFieldCtx2.moveTo(canvas2X, canvas2Y);
      } else {
        this.radarCtx.lineTo(canvasX, canvasY);
        this.gameFieldCtx1.lineTo(canvas2X, canvas2Y);
        this.gameFieldCtx2.lineTo(canvas2X, canvas2Y);
      }
    });

    this.radarCtx.stroke();
    this.gameFieldCtx1.stroke();
    this.gameFieldCtx2.stroke();
    this.terrainPoints = points;
  }

  getTerrainYAt(x) {
    if (!this.terrainPoints || this.terrainPoints.length === 0) {
      return this.gameField.height - 100;
    }

    const percentX = (x / this.worldWidth) * 100;

    for (let i = 0; i < this.terrainPoints.length - 1; i++) {
      const p1 = this.terrainPoints[i];
      const p2 = this.terrainPoints[i + 1];

      const x1 = parseFloat(p1[0]);
      const x2 = parseFloat(p2[0]);

      if (percentX >= x1 && percentX <= x2) {
        const y1 = (parseFloat(p1[1]) / 100) * this.gameField.height;
        const y2 = (parseFloat(p2[1]) / 100) * this.gameField.height;

        const t = (percentX - x1) / (x2 - x1);
        return y1 + t * (y2 - y1);
      }
    }

    return this.gameField.height - 100;
  }

  spawnHumanoids() {
    this.humanoids = [];
    const spacing = this.worldWidth / this.totalHumanoids;

    for (let i = 0; i < this.totalHumanoids; i++) {
      const margin = (Math.random() - 0.5) * 100;
      const x = i * spacing + margin;
      const surfaceY = this.getTerrainYAt(x);
      const feetOnGroundY = surfaceY - 36;

      this.humanoids.push(new Humanoid(x, feetOnGroundY));
    }
  }

  updateAndDrawHumanoids() {
    const radarYScale = this.radar.height / this.gameField.height;

    for (let i = this.humanoids.length - 1; i >= 0; i--) {
      const h = this.humanoids[i];

      h.update(this.worldWidth, (x) => this.getTerrainYAt(x));

      if (h.state === 'DEAD') {
        this.humanoids.splice(i, 1);
        continue;
      }

      h.draw(this.shipCtx, this.camera.scrollX);

      h.drawRadar(
        this.radarShipCtx,
        this.radar.width,
        this.worldWidth,
        radarYScale,
      );
    }
  }

  fireLaser() {
    const now = Date.now();
    if (now - this.lastShotTime < this.fireRateCooldown) return;
    this.lastShotTime = now;

    const nosePos = this.ship.getNosePosition(
      this.shipCanvas.width,
      this.camera.offsetX,
    );
    this.lasers.push(new Laser(nosePos.x, nosePos.y, this.ship.facing));
  }

  drawRadarViewportBox() {
    const visibleWidthRatio = this.viewport.clientWidth / this.worldWidth;
    const boxWidth = this.radar.width * visibleWidthRatio;
    const boxX = (this.camera.scrollX / this.worldWidth) * this.radar.width;

    this.radarShipCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.radarShipCtx.lineWidth = 1;
    this.radarShipCtx.strokeRect(boxX, 0, boxWidth, this.radar.height);
  }

  moveShip() {
    const screenCenterX = this.shipCanvas.width / 2;
    const renderX = screenCenterX - 75 - this.camera.offsetX;

    this.shipCtx.clearRect(0, 0, this.shipCanvas.width, this.shipCanvas.height);
    this.shipCtx.save();

    if (this.ship.facing === -1) {
      this.shipCtx.translate(renderX + 75, this.ship.y + 35);
      this.shipCtx.scale(-1, 1);
      this.shipCtx.drawImage(shipSprite, -75, -35, 150, 70);
    } else {
      this.shipCtx.drawImage(shipSprite, renderX, this.ship.y, 150, 70);
    }

    this.shipCtx.restore();
  }

  moveShipRadar() {
    const radarShipX =
      (this.camera.scrollX / this.worldWidth) * this.radar.width + 45;

    this.radarShipCtx.clearRect(
      0,
      0,
      this.radarShipCanvas.width,
      this.radarShipCanvas.height,
    );

    if (this.ship.facing === -1) {
      this.radarShipCtx.save();
      this.radarShipCtx.translate(radarShipX + 30 + 50, this.ship.radarY);
      this.radarShipCtx.scale(-1, 1);
      this.radarShipCtx.drawImage(shipSprite, 0, 0, 30, 15);
      this.radarShipCtx.restore();
    } else {
      this.radarShipCtx.save();
      this.radarShipCtx.drawImage(
        shipSprite,
        radarShipX,
        this.ship.radarY,
        30,
        15,
      );
      this.radarShipCtx.restore();
    }

    this.drawRadarViewportBox();
  }

  updateAndDrawLasers() {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      if (!laser.update()) {
        this.lasers.splice(i, 1);
        continue;
      }
      laser.draw(this.shipCtx);
    }
  }

  handleInput() {
    // Horizontal Movement
    if (this.input.isMovingRight()) {
      if (this.ship.facing !== 1) this.ship.reverse();
      this.ship.speedUp();
    } else if (this.input.isMovingLeft()) {
      if (this.ship.facing !== -1) this.ship.reverse();
      this.ship.speedUp();
    } else {
      this.ship.coast();
    }

    // Vertical Movement
    if (this.input.isMovingUp()) this.ship.moveUp();
    if (this.input.isMovingDown()) this.ship.moveDown();

    // Action Inputs
    if (this.input.isFiring()) this.fireLaser();
    if (this.input.isDeployingBomb()) this.ship.deployBomb();
    if (this.input.isActivatingWarp()) this.ship.activateWarp();
  }

  start() {
    this.generateTerrain(0, 70, 100, 70, 2.5, 35);
    this.spawnHumanoids();
    this.gameLoop();
  }

  gameLoop() {
    this.handleInput();

    // Physics & Camera updates
    this.camera.move(this.ship.velocity, this.worldWidth);
    this.camera.update(
      this.ship.facing,
      this.viewport.clientWidth,
      this.worldWidth,
    );

    // Render frame
    this.canvasStrip.style.transform = `translateX(${-this.camera.scrollX}px)`;
    this.moveShip();
    this.moveShipRadar();
    this.updateAndDrawHumanoids();
    this.updateAndDrawLasers();

    requestAnimationFrame(() => this.gameLoop());
  }
}

const game = new GameManager();
game.start();
