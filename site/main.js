let started = false;
const canvas = obj('canvas');

pacman.load(canvas);

document.on('keydown',async e=>{
	// return;
	if(e.key != ' ') return;
	if(started) return;
	pacman.load(canvas);
	started = true;
	let req = await fetch('assets/levels/maze1.json');
	let data = await req.json();
	obj('game').requestFullscreen();
	pacman.start(canvas,data).then(score=>{
		started = false;
	});
})
