// constants
const WORLD_WIDTH = 10000;
const VIEW_PORT = 800;

// variables

// Game States
let menu, playing, Level_complete, player_death, game_over;

// Player Stats
let score, lives, smart_bombs, active_level;

// cached DOM elements

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
  // Calculate overall distance and angles
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const perpAngle = angle + Math.PI / 2;
  const totalSegments = Math.max(1, Math.floor(distance / segmentLength));


  const points = [`${x1},${y1}`];
  for (let i = 1; i < totalSegments; i++) {
    const t = i / totalSegments;
    const baseX = x1 + dx * t;
    const baseY = y1 + dy * t;
    const offset = (Math.random() - 0.5) * jagginess;
    const jagX = baseX + Math.cos(perpAngle) * offset;
    const jagY = baseY + Math.sin(perpAngle) * offset;
    points.push(`${jagX.toFixed(1)},${jagY.toFixed(1)}`);
  }
  points.push(`${x2},${y2}`);
  const pointsString = points.join(' ');

  const svgNamespace = 'http://www.w3.org/2000/svg';

  const screenConfigs = [
    { target: parentNodes[0], strokeWidth: '.7' }, 
    { target: parentNodes[1], strokeWidth: '0.1' }  
  ];

  
  screenConfigs.forEach(config => {
    
    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.setAttribute('style', 'position: absolute; top: 0; left: 0; z-index: 10; pointer-events: none;');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    const polyline = document.createElementNS(svgNamespace, 'polyline');
    polyline.setAttribute('points', pointsString); 
    polyline.setAttribute('stroke', 'red');
    polyline.setAttribute('stroke-width', config.strokeWidth); 
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke-linecap', 'square');
    polyline.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(polyline);
    config.target.appendChild(svg);
  });
};

// Cached containers setup
// const containers = document.getElementsByClassName('container');
// generate_terrain(containers, 0, 50, 100, 50, 2, 8);

const containers = document.getElementsByClassName('container');

generate_terrain(containers, 0, 70, 100, 70, 2.5, 35);
// Game loop
