let started = false;
const canvas = obj('canvas');


var prompted = false;

KeyShow.load().then(e=>{
	pacman.load(canvas);
});

KeyShow.parentElement = obj('game');

async function tutorial(){
	if(!prompted){
		prompted = true;
		await KeyShow.prompt('arrows','To Move')
		await KeyShow.prompt('f4','Fullscreen')
	}
}

async function editorInstructions(){
	await KeyShow.prompt('wasd','To Build Walls<br> (use your mouse)')
	await KeyShow.prompt('space','To make yellow and red dots')
	await KeyShow.prompt('ctrl+s','To save your level')
}

document.on('keydown',async e=>{
	// return;
	if(started) return;
	if(e.key == ' '){
		started = true;
		let req = await fetch('assets/levels/maze1.json');
		let data = await req.json();
		pacman.edit(false);
		pacman.start(canvas,data).then(score=>{
			started = false;
		});
		tutorial();
	}
	if(e.key.toLowerCase() == 'l'){
		started = true;
		let req = await fetch('assets/levels/maze1.json');
		let data = await req.json();
		pacman.edit(false);
		pacman.edit(true);
		editorInstructions();
		pacman.start(canvas,data).then(score=>{
			started = false;
		});
	}
	if(e.key.toLowerCase() == 'c'){
		KeyShow.prompt('1','To choose<br>Level #1 etc.')
		let data = await pacman.loadCustomLevel();
		if(data){
			started = true;
			console.log(data);
			pacman.edit(false);
			pacman.start(canvas,data).then(score=>{
				started = false;
			});
		} else {
			console.log('NO DATA')
		}
	}
	if(e.key.toLowerCase() == 'h'){
		ctx.clearRect(-2,-2,canvas.width+2,canvas.height+2);
		pacman.hideScores();
		pacman.load(canvas);
	}
},true);
