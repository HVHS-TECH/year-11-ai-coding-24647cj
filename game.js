const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

let W = canvas.width;
let H = canvas.height;

function resizeCanvas() {
	const ratio = window.devicePixelRatio || 1;
	canvas.width = W * ratio;
	canvas.height = H * ratio;
	canvas.style.width = W + 'px';
	canvas.style.height = H + 'px';
	ctx.setTransform(ratio,0,0,ratio,0,0);
}

resizeCanvas();

const bird = {
	x: 80,
	y: H/2,
	w: 34,
	h: 24,
	vy: 0,
	gravity: 0.6,
	jump: -10,
	rotation:0
};

const pipes = [];
const PIPE_W = 60;
const GAP = 150;
const PIPE_SPEED = 2.4;
let lastPipeTime = 0;
let pipeInterval = 1500;

let score = 0;
let best = Number(localStorage.getItem('flappy_best')||0);
bestEl.textContent = 'Best: ' + best;

let running = false;
let gameOver = false;

function spawnPipe() {
	const topH = 80 + Math.random()*(H - GAP - 160);
	pipes.push({x: W + 20, top: topH, bottom: topH + GAP, passed:false});
}

function reset() {
	bird.y = H/2; bird.vy = 0; bird.rotation = 0;
	pipes.length = 0; score = 0; gameOver = false; running = true;
	lastPipeTime = performance.now();
	spawnPipe();
}

function flap() {
	if (!running) { reset(); return; }
	if (gameOver) { reset(); return; }
	bird.vy = bird.jump;
}

function update(dt) {
	if (!running) return;
	// bird physics
	bird.vy += bird.gravity;
	bird.y += bird.vy;
	bird.rotation = Math.max(-0.6, Math.min(1.2, bird.vy/10));

	// pipes
	for (let p of pipes) {
		p.x -= PIPE_SPEED;
		if (!p.passed && p.x + PIPE_W < bird.x) { score++; p.passed = true; scoreEl.textContent = 'Score: ' + score; if (score>best){best=score;bestEl.textContent='Best: '+best;localStorage.setItem('flappy_best',best);} }
	}
	// remove offscreen
	while (pipes.length && pipes[0].x + PIPE_W < -50) pipes.shift();

	// spawn
	if (performance.now() - lastPipeTime > pipeInterval) { spawnPipe(); lastPipeTime = performance.now(); }

	// collision
	if (bird.y + bird.h/2 >= H) { gameOver = true; running = false; }
	if (bird.y - bird.h/2 <= 0) { bird.y = bird.h/2; bird.vy = 0; }

	for (let p of pipes) {
		const bx = bird.x, by = bird.y, bw = bird.w, bh = bird.h;
		if (bx + bw/2 > p.x && bx - bw/2 < p.x + PIPE_W) {
			if (by - bh/2 < p.top || by + bh/2 > p.bottom) {
				gameOver = true; running = false;
			}
		}
	}
}

function draw() {
	// background
	ctx.clearRect(0,0,W,H);
	ctx.fillStyle = '#70c5ce'; ctx.fillRect(0,0,W,H);

	// draw pipes
	for (let p of pipes) {
		ctx.fillStyle = '#2ecc71';
		ctx.fillRect(p.x, 0, PIPE_W, p.top);
		ctx.fillRect(p.x, p.bottom, PIPE_W, H - p.bottom);
		ctx.fillStyle = '#1e8449';
		ctx.fillRect(p.x, p.top-10, PIPE_W, 10);
	}

	// draw ground
	ctx.fillStyle = '#ded895'; ctx.fillRect(0, H-40, W, 40);

	// draw bird
	ctx.save();
	ctx.translate(bird.x, bird.y);
	ctx.rotate(bird.rotation);
	ctx.fillStyle = '#ffdd57';
	ctx.fillRect(-bird.w/2, -bird.h/2, bird.w, bird.h);
	ctx.restore();

	if (!running && !gameOver) {
		ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(W/2-140, H/2-50, 280, 100);
		ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.font='20px Arial'; ctx.fillText('Click / Space to start', W/2, H/2);
	}

	if (gameOver) {
		ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W/2-160, H/2-80, 320, 160);
		ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.font='26px Arial'; ctx.fillText('Game Over', W/2, H/2 - 8);
		ctx.font='18px Arial'; ctx.fillText('Click / Space to try again — Score: ' + score, W/2, H/2 + 22);
	}
}

let last = performance.now();
function loop(t) {
	const dt = t - last; last = t;
	update(dt);
	draw();
	requestAnimationFrame(loop);
}

// input
window.addEventListener('keydown', e=>{ if (e.code==='Space' || e.code==='ArrowUp') { e.preventDefault(); flap(); } });
canvas.addEventListener('mousedown', ()=>flap());
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); flap(); }, {passive:false});

// start loop
reset();
requestAnimationFrame(loop);

console.log('Flappy game initialized');