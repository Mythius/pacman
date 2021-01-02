let started = false;
const canvas = obj('canvas');


pacman.load(canvas);

document.on('keydown',async e=>{
	if(e.key != ' ') return;
	if(started) return;
	started = true;
	let req = await fetch('assets/levels/maze1.json');
	let data = await req.json();
	pacman.start(canvas,data);
	canvas.requestFullscreen();
})