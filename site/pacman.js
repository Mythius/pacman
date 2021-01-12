(function(global){
	Save.init();
	const pacman = {};
	global.pacman = pacman;
	const EDITOR = false;
	let canvas,ctx,game;
	var playing = false;
	var fps = 30;
	var grid;
	var wallcolor = 'blue';
	let controls;
	var player;
	var ghosts = [];
	var drawable = [];
	var timer;
	var score = 0;
	var ghost_multiplier = 1;
	const default_config = {
		fps:30,
		w:10,
		h:13,
		scale:40,
		controls: {u:'w',d:'s',l:'a',r:'d'},
		wallcolor: 'darkblue'
	};
	const MAX_LEVELS = 2;
	var level = 1;
	var current_game;
	var pathfind;
	const distance = Vector.distance;
	let can_move = true;
	var bigdot = false;
	var game_config = default_config;
	var LOOP_TIMEOUT;
	var hideScores = () => {};
	Tile.prototype.w01 = false;
	Tile.prototype.w21 = false;
	Tile.prototype.w10 = false;
	Tile.prototype.w12 = false;
	Tile.prototype.dotType = '';
	Tile.prototype.setWall = function(dx,dy,v=true){
		let curvalue = this[dxdystr(dx,dy)];
		this[dxdystr(dx,dy)] = (v==='toggle') ? !curvalue : v;
		let adj=this.grid.getTileAt(this.x+dx,this.y+dy);
		if(adj)adj[dxdystr(dx*-1,dy*-1)] = (v==='toggle') ? !curvalue : v;
	}
	Tile.prototype.isIntersection = function(){
		let opts = 0;
		if(!this.w01) opts++;
		if(!this.w21) opts++;
		if(!this.w10) opts++;
		if(!this.w12) opts++;
		return opts > 2;
	}
	function distile(tile1,tile2){
		return distance(tile1.x,tile1.y,tile2.x,tile2.y);
	}
	class Ghost extends Sprite{
		constructor(color,movement){
			super();
			this.addAnimation(`assets/${color}.anims`).then(e=>{
				this.animation.play('left',true);
			});
			this.dx = 0;
			this.dy = 0;
			movement.bind(this);
			this.addMovement(movement);
			drawable.push(this);
			ghosts.push(this);
			this.glideTo(grid.getTileAt(3,5),1);
			this.alive = true;
		}
		getOpts(tile = this.currentTile){
			let curtile = tile;
			let up = curtile.w10;
			let down = curtile.w12;
			let left = curtile.w01;
			let right = curtile.w21;
			const DOWN = {dx:0,dy:1,dir:'down'};
			const UP = {dx:0,dy:-1,dir:'up'};
			const LEFT = {dx:-1,dy:0,dir:'left'};
			const RIGHT = {dx:1,dy:0,dir:'right'};
			let opts = [];
			if(!left) opts.push(LEFT);
			if(!right) opts.push(RIGHT);
			if(!up) opts.push(UP);
			if(!down) opts.push(DOWN);
			return opts;
		}
		getDirOpts(){
			let curtile = this.currentTile;
			let up = !curtile.w10;
			let down = !curtile.w12;
			let left = !curtile.w01;
			let right = !curtile.w21;
			let paths = {up,down,left,right};
			const DOWN = {dx:0,dy:1,dir:'down'};
			const UP = {dx:0,dy:-1,dir:'up'};
			const LEFT = {dx:-1,dy:0,dir:'left'};
			const RIGHT = {dx:1,dy:0,dir:'right'};
			let opts = [];
			if(curtile.isIntersection()){
				if(this.dx == 1){}
			}
			if(this.dx == 1){
				if(curtile.isIntersection()){
					opts = [UP,RIGHT,DOWN].filter(e=>paths[e.dir]);
				} else if(!right){
					if(up){
						opts.push(UP);
					}
					if(down){
						opts.push(DOWN);
					}
					if(opts.length == 0){
						opts.push(LEFT);
					}
				} else {
					opts.push(RIGHT)
				}
			} else if(this.dx == -1){
				if(curtile.isIntersection()){
					opts = [UP,LEFT,DOWN].filter(e=>paths[e.dir]);
				} else if(!left){
					if(up){
						opts.push(UP);
					}
					if(down){
						opts.push(DOWN);
					}
					if(opts.length == 0){
						opts.push(RIGHT);
					}
				} else {
					opts.push(LEFT);
				}
			} else if(this.dy == -1){
				if(curtile.isIntersection()){
					opts = [LEFT,RIGHT,UP].filter(e=>paths[e.dir]);
				} else if(!up){
					if(left){
						opts.push(LEFT);
					}
					if(right){
						opts.push(RIGHT);
					}
					if(opts.length == 0){
						opts.push(DOWN);
					}
				} else {
					opts.push(UP);
				}
				
			} else if(this.dy == 1){
				if(curtile.isIntersection()){
					opts = [DOWN,RIGHT,LEFT].filter(e=>paths[e.dir]);
				} else if(!down){
					if(left){
						opts.push(LEFT);
					}
					if(right){
						opts.push(RIGHT);
					}
					if(opts.length == 0){
						opts.push(UP);
					}
				} else {
					opts.push(DOWN);
				}
			} else {
				opts = this.getOpts();
			}
			return opts;
		}
		makeMove(opt){
			if(!can_move) return;
			this.dx = opt.dx;
			this.dy = opt.dy;
			let nx = (this.currentTile.x + this.dx + grid.width) % grid.width;
			let ny = (this.currentTile.y + this.dy + grid.height) % grid.height;
			let tx = this.currentTile.x + this.dx;
			let ty = this.currentTile.y + this.dy;
			let nt = grid.getTileAt(nx,ny);
			if(!this.alive){
				this.animation.play('dead-'+opt.dir,true);
			} else if(!bigdot){
				this.animation.play(opt.dir,true);
			}
			if(nt != this.currentTile){
				let glideVal = (tx === nx && ty === ny) ? 273 / (1000 / fps) + 1 : 1;
				if(bigdot) glideVal+=3; // slower;
				if(!this.alive) glideVal = 2;
				if(nt == player.currentTile){
					if(bigdot && this.alive){
						this.alive = false;
						score += ghost_multiplier * 100;
						ghost_multiplier *= 2;
						///////////////// START PATHFINDING /////////////
					} else if(this.alive) {
						audio.play('assets/sounds/death.wav');
						can_move = false;
						player.animation.play('die');
						setTimeout(stop,1500);
					}
				}
				this.glideTo(nt,glideVal).then(e=>{
					if(nt == player.currentTile){
						if(bigdot && this.alive){
							this.alive = false;
							score += ghost_multiplier * 100;
							ghost_multiplier *= 2;
							///////////////// START PATHFINDING /////////////
						} else if(this.alive) {
							audio.play('assets/sounds/death.wav');
							can_move = false;
							player.animation.play('die');
							setTimeout(stop,1500);
						}
					}
				});
				if(tx > 2 && tx < 7 && ty > 4 && ty < 7){
					this.alive = true;
					if(bigdot){
						this.animation.play('run',true);
					}
				}
			}
		}
	}
	const dxdystr=(dx,dy)=>`w${dx+1}${dy+1}`;
	Sprite.prototype.glideTo = async function(tile,ms=8){
		if(!can_move) return;
		this.currentTile = tile;
		let ct = tile.getCenter();
		await this.slideTo(ct.x,ct.y,ms);
	}
	Tile.prototype.draw = function(){

		const drawLine = (x1,y1,x2,y2) => {
			ctx.beginPath();
			ctx.lineWidth = 3;
			ctx.strokeStyle = wallcolor;
			ctx.moveTo(x1,y1);
			ctx.lineTo(x2,y2);
			ctx.stroke();
		};

		const arc = (x,y,r,s,e) => {
			ctx.beginPath();
			ctx.lineWidth = 3;
			ctx.strokeStyle = wallcolor;
			ctx.arc(x,y,r,s,e);
			ctx.stroke();
		}

		// this.draw_box();
		let ct = this.getCenter();
		let w2 = this.grid.scale/2;
		ctx.save();
		ctx.translate(ct.x,ct.y);
		// MAIN LINES
		if(this.w01) drawLine(-w2+5,-w2+10,-w2+5,+w2-10);
		if(this.w21) drawLine(+w2-5,-w2+10,+w2-5,+w2-10);
		if(this.w10) drawLine(-w2+10,-w2+5,+w2-10,-w2+5);
		if(this.w12) drawLine(-w2+10,+w2-5,+w2-10,+w2-5);

		// ROUNDED CORNERS
		if(this.w01 && this.w10) arc(-w2+10,-w2+10,5,Math.PI/2*2,Math.PI/2*3);
		if(this.w21 && this.w10) arc(+w2-10,-w2+10,5,Math.PI/2*3,Math.PI/2*4);
		if(this.w21 && this.w12) arc(+w2-10,+w2-10,5,Math.PI/2*4,Math.PI/2*1);
		if(this.w01 && this.w12) arc(-w2+10,+w2-10,5,Math.PI/2*1,Math.PI/2*2);


		// VERTICAL CORNERS
		if(this.w01 && !this.w10) drawLine(-w2+5,-w2+10,-w2+5,-w2);
		if(this.w01 && !this.w12) drawLine(-w2+5,+w2-10,-w2+5,+w2);

		if(this.w21 && !this.w10) drawLine(+w2-5,-w2+10,+w2-5,-w2);
		if(this.w21 && !this.w12) drawLine(+w2-5,+w2-10,+w2-5,+w2);

		// HORIZONTAL CORNERS
		if(this.w10 && !this.w01) drawLine(-w2,-w2+5,-w2+10,-w2+5);
		if(this.w10 && !this.w21) drawLine(+w2,-w2+5,+w2-10,-w2+5);

		if(this.w12 && !this.w01) drawLine(-w2,+w2-5,-w2+10,+w2-5);
		if(this.w12 && !this.w21) drawLine(+w2,+w2-5,+w2-10,+w2-5);

		// NO WALLS 
		if(!this.w01 && !this.w10) arc(-w2,-w2,5,Math.PI/2*4,Math.PI/2*1);
		if(!this.w21 && !this.w10) arc(+w2,-w2,5,Math.PI/2*1,Math.PI/2*2);
		if(!this.w21 && !this.w12) arc(+w2,+w2,5,Math.PI/2*2,Math.PI/2*3);
		if(!this.w01 && !this.w12) arc(-w2,+w2,5,Math.PI/2*3,Math.PI/2*4);

		if(this.dotType == 'big'){
			ctx.beginPath();
			ctx.arc(0,0,6,0,Math.PI*2);
			ctx.fillStyle = 'red';
			ctx.fill();
		} else if (this.dotType == 'small'){
			ctx.beginPath();
			ctx.arc(0,0,2,0,Math.PI*2);
			ctx.fillStyle = 'yellow';
			ctx.fill();
		}

		ctx.restore();
	}
	Grid.prototype.draw = function(){
		this.forEach(tile=>{
			tile.draw();
		});
	}
	function loadWalls(){

		// MAKE OUTSIDE WALLS SOLID
		grid.forEach(tile=>{
			if(tile.x == 0) tile.setWall(-1,0);
			if(tile.y == 0) tile.setWall(0,-1);
			if(tile.x == grid.width-1) tile.setWall(1,0);
			if(tile.y == grid.height-1) tile.setWall(0,1);
		})
	}
	function setupMovement(){
		this.currentTile = null;
		this.nextMove = '';
		this.dx = 0;
		this.dy = 0;
	}
	function handleControls(){
		if(keys.down(controls.u)) player.nextMove = controls.u;
		if(keys.down(controls.d)) player.nextMove = controls.d;
		if(keys.down(controls.l)) player.nextMove = controls.l;
		if(keys.down(controls.r)) player.nextMove = controls.r;
	}
	function playerControls(){
		const THIS = this;

		if(!can_move) return;


		if(this.nextMove.length !== 0){
			let pos = setDXDY(this.nextMove);
			if(!this.currentTile[dxdystr(pos.dx,pos.dy)]){
				setDXDY(this.nextMove,true);
			}
		}

		if(this.currentTile[dxdystr(this.dx,this.dy)]){
			this.animation.stop();
			this.dx = 0;
			this.dy = 0;
		}

		let nx = (this.currentTile.x + this.dx + grid.width) % grid.width;
		let ny = (this.currentTile.y + this.dy + grid.height) % grid.height;
		let tx = this.currentTile.x + this.dx;
		let ty = this.currentTile.y + this.dy;

		let nt = grid.getTileAt(nx,ny);

		if(nt != this.currentTile){
			let glideVal = (tx === nx && ty === ny) ? 273 / (1000 / fps) : 1;
			this.glideTo(nt,glideVal).then(e=>{
				if(nt.dotType == 'big'){
					bigdot = true;
					for(let g of ghosts) g.animation.play('run',true);
					audio.stop('assets/sounds/bigdot.mp3');
					ghost_multiplier = 1;
					audio.play('assets/sounds/bigdot.mp3',true);
					clearTimeout(timer);
					timer = setTimeout(()=>{
						for(let g of ghosts) g.animation.play('flash',true);
						timer = setTimeout(()=>{
							bigdot = false;
							audio.stop('assets/sounds/bigdot.mp3');
						},2000);
					},6000);
				}
				if(nt.dotType != ''){
					audio.play('assets/sounds/wakka.wav',false,.3);
					score+=5;
				}
				nt.dotType = '';
				if(playerWins() && !EDITOR){
					can_move = false;
					audio.stopAll();
					audio.play('assets/sounds/intermission.wav');
					player.animation.stop();
					started = false;
					score += 500;
					setTimeout(e=>{
						level++;
						if(LEVEL <= MAX_LEVELS){
							stop(false);
							fetch(`assets/levels/maze${level}.json`).then(request=>{
								request.json().then(obj=>{
									obj.score = score;
									loadMap(canvas,obj).then((request,reject)=>{
										current_game = request;
									});
								});
							})
						} else {
							score += MAX_LEVELS * 250;
							stop(true);
						}
					},5000);
				}
			});
		}

		function setDXDY(key,actual=false){
			let moved = true;
			let dx,dy,direction;
			switch(key){
				case controls.u:dx=0;dy=-1;direction=270; break;
				case controls.l:dx=-1;dy=0;direction=180; break;
				case controls.r:dx=+1;dy=0;direction=0;   break;
				case controls.d:dx=0;dy=+1;direction=90;  break;
				default: moved = false; break;
			}
			if(actual){
				THIS.dx = dx;
				THIS.dy = dy;
				THIS.direction = direction;
				THIS.animation.play('eat',true);
				THIS.nextMove = '';
			}
			return {dx,dy,direction};
		}


		if(EDITOR){
			let active_tile = grid.getActiveTile();
			let types = ['','small','big'];
			if(active_tile){
				if(keys.down('arrowup')){
					active_tile.setWall(0,-1,'toggle');
					keys.keys['arrowup'] = false;
				} else if(keys.down('arrowdown')){
					active_tile.setWall(0,1,'toggle');
					keys.keys['arrowdown'] = false;
				} else if(keys.down('arrowright')){
					active_tile.setWall(1,0,'toggle');
					keys.keys['arrowright'] = false;
				} else if(keys.down('arrowleft')){
					active_tile.setWall(-1,0,'toggle');
					keys.keys['arrowleft'] = false;
				} else if(keys.down(' ')){
					let ix = Math.max(types.indexOf(active_tile.dotType));
					ix = (ix + 1) % 3;
					active_tile.dotType = types[ix];
					keys.keys[' '] = false;
				}
			}
		}
	}
	function playerWins(){
		let win = true;
		grid.forEach(tile=>{
			if(tile.dotType != ''){
				win = false;
				return true;
			}
		});
		return win;
	}
	function pinkMovement(){
		let opts = this.getDirOpts();
		let allopts = this.getOpts();
		let goal = player.currentTile;
		const x = this.currentTile.x;
		const y = this.currentTile.y;
		let path;
		if(!this.alive){
			goal = grid.getTileAt(4,6);
			path = pathfind.find(this.currentTile,goal);
			let dx = path[1].x - x;
			let dy = path[1].y - y;
			opts = allopts.filter(e=>e.dx==dx&&e.dy==dy);
		} else {
			opts = opts.sort((a,b)=>Math.random()-.5);
		}
		this.makeMove(opts[0]);
	}
	function cyanMovement(){
		let opts = this.getDirOpts();
		let allopts = this.getOpts();
		let goal;
		const x = this.currentTile.x;
		const y = this.currentTile.y;
		let path;
		if(!this.alive){
			goal = grid.getTileAt(4,6);
			path = pathfind.find(this.currentTile,goal);
			if(path.length < 2){
				opts = opts.sort((a,b)=>Math.random()-.5);
			} else {
				let dx = path[1].x - x;
				let dy = path[1].y - y;
				opts = allopts.filter(e=>e.dx==dx&&e.dy==dy);
			}
		} else {
			goal = player.currentTile;
			path = pathfind.find(this.currentTile,goal);
			if(path.length < 2){
				opts = opts.sort((a,b)=>Math.random()-.5);
			} else {
				let dx = path[1].x - x;
				let dy = path[1].y - y;
				opts = allopts.filter(e=>e.dx==dx&&e.dy==dy);
			}
		}
		this.makeMove(opts[0]);
	}
	function orangeMovement(){
		let opts = this.getDirOpts();
		let allopts = this.getOpts();
		let goal = player.currentTile;
		const x = this.currentTile.x;
		const y = this.currentTile.y;
		let path;
		if(!this.alive){
			goal = grid.getTileAt(4,6);
			path = pathfind.find(this.currentTile,goal);
			let dx = path[1].x - x;
			let dy = path[1].y - y;
			opts = allopts.filter(e=>e.dx==dx&&e.dy==dy);
		} else {
			opts = opts.sort((a,b)=>Math.random()-.5);
		}
		this.makeMove(opts[0]);
	}
	function redMovement(){
		let opts = this.getDirOpts();
		let allopts = this.getOpts();
		let goal = player.currentTile;
		const x = this.currentTile.x;
		const y = this.currentTile.y;
		let path;
		if(!this.alive){
			goal = grid.getTileAt(4,6);
			path = pathfind.find(this.currentTile,goal);
			let dx = path[1].x - x;
			let dy = path[1].y - y;
			opts = allopts.filter(e=>e.dx==dx&&e.dy==dy);
		} else {
			opts = opts.sort((a,b)=>Math.random()-.5);
		}
		this.makeMove(opts[0]);
	}
	function start(CANVAS,config=default_config){
		can_move = true;
		bigdot = false;

		ghosts = [];
		drawable = [];
		canvas = CANVAS;
		ctx = canvas.getContext('2d');
		player = new Sprite('assets/player/01.png');
		player.addAnimation('assets/player.anims')//.then(e=>console.log('Animation Loaded',player.animation));
		if(!EDITOR){
		}
		player.addMovement(playerControls);
		playerControls.bind(player);
		setupMovement.bind(player).call();
		playing = true;
		fps = config.fps;
		wallcolor = config.wallcolor;
		controls = config.controls;

		grid = new Grid(config.w,config.h,canvas.height/config.h);
		drawable.push(grid);
		drawable.push(player);
		pathfind.grid = grid;

		grid.offsetX = canvas.width/2-grid.width*grid.scale/2;
		grid.offsetY = canvas.height/2-grid.height*grid.scale/2;


		keys.start();
		
		if(EDITOR) mouse.start(canvas);

		canvas = canvas;
		global.ctx = ctx;
		global.grid = grid;
		global.player = player;
		global.ghosts = ghosts;

		if(EDITOR) loadWalls();

		player.glideTo(grid.getTileAt(0,0),1);

		if(!EDITOR){
			new Ghost('cyan',cyanMovement);
			new Ghost('orange',orangeMovement);
			new Ghost('red',redMovement);
			new Ghost('pink',pinkMovement);
		}
	}
	async function stop(done=true){
		if(!playing) return;
		playing = false;
		if(LOOP_TIMEOUT) clearTimeout(LOOP_TIMEOUT);
		if(done) {
			let hs = await Save.getAll();
			let addName = false;
			addName |= hs.length < 10;
			let amount = 0;
			for(let score of hs){
				if(score.data > score){
					amount++;
				}
			}
			addName |= amount < 10;
			if(addName){
				let name = await input();
				let d = await Save.read(name);
				if(d == undefined){
					await Save.save(name,score);
				}
				if(d < score){
					await Save.save(name,score);
				}
			}
			let next = getHighScores();
			current_game(score);
		}
	}
	function loop(){
		if(!playing) return;
		LOOP_TIMEOUT = setTimeout(loop,1000/fps);
		ctx.clearRect(-2,-2,canvas.width+2,canvas.height+2);
		handleControls();
		for(let thing of drawable) {
			if(thing instanceof Ghost && !can_move) continue; // Dont draw ghost if game over.
			thing.draw();
		}
	}
	function mapToJSON(){
		let result = {};
		result.width = grid.width;
		result.height = grid.height;
		result.grid = [];
		result.wc = wallcolor;
		grid.forEach(tile=>{
			let t = {};
			t.d = tile.dotType;
			t.w01 = +tile.w01;
			t.w21 = +tile.w21;
			t.w12 = +tile.w12;
			t.w10 = +tile.w10;
			result.grid.push(t);
		});
		return result;
	}
	async function loadMap(obj,json={score:0,level:1},config=default_config){
		hideScores();
		if(typeof json == 'string') json = JSON.parse(json);
		game_config = config;
		game_config.w = json.width;
		game_config.h = json.height;
		game_config.wallcolor = json.wc;
		level = json.level || 1;
		score = json.score || 0;
		start(obj,game_config);
		let i=0;
		if(EDITOR){
			loadWalls();
			loop();
		} else {
			grid.forEach(tile=>{
				tile.dotType = json.grid[i].d;
				tile.w01 = !!json.grid[i].w01;
				tile.w21 = !!json.grid[i].w21;
				tile.w12 = !!json.grid[i].w12;
				tile.w10 = !!json.grid[i].w10;
				i++;
			});
			loop();
			await audio.play('assets/sounds/start.wav',false,.9);
		}
		let gl = new Promise((resolve,reject)=>{
			current_game = resolve;
		});
		return await gl;
	}
	function input(data='NEW HIGH SCORE'){
		return new Promise((res,rej)=>{
			let e = create('div',data);
			e.classList.add('score');
			e.style.borderImage = "url('assets/g/border.png') 50";
			obj('game').appendChild(e);
			let input = create('input');
			e.appendChild(input);
			input.maxlength = "8";
			let button = create('button','OK');
			e.appendChild(button);
			input.focus();
			input.on('keydown',ev=>{
				if(ev.keyCode == 13){
					res(input.value);
					e.remove();
				}
			})
			button.on('click',()=>{
				res(input.value);
				e.remove();
			});
		});
	}
	async function getHighScores(){
		let highScores = await Save.getAll();
		highScores = [...highScores].sort((a,b)=>b.data-a.data);
		let el = create('div','-- HIGH SCORES --<br><br');
		el.innerHTML += `<br>Player   Score<br><br>`;
		let i =0;
		for(let score of highScores){
			el.innerHTML += score.name + ' ' + score.data + '<br><br>';
			i++;
			if(i > 9) break;
		}
		el.innerHTML += 'Click [SPACE] to play Again!';
		el.classList.add('score');
		el.style.height='500px';
		obj('game').appendChild(el);
		const next = () => { el.remove() };
		hideScores = next;
		return {next};
	}
	pacman.stop = stop;
	pacman.start = loadMap;
	pacman.input = input;
	pacman.highScore = getHighScores;
	pacman.export = () => JSON.stringify(mapToJSON());
	pacman.load = canvas => {
		let ctx = canvas.getContext('2d');
		let logo = new Image();
		logo.src = 'assets/g/logo.jpg';
		document.fonts.ready.then(e=>{
			ctx.font = '30px pressstart2p';
			ctx.fillStyle = '#fcba03';
			ctx.fillText('Press SPACE to Start',canvas.width/7,canvas.height*3/4);
		});
		logo.onload = () => {
			ctx.drawImage(logo,0,canvas.height/2-logo.height/2,canvas.width,canvas.height/3);
		}
		pathfind = pacman.pathfind;
	}
})(this);


(function(global){

	const pathfind = {};
	global.pathfind = pathfind;

	var open_set,closed_set,stack,start,end;

	var finding = false;

	pathfind.grid = null; // set this manually

	function getOpts(tile){
			let curtile = tile;
			let up = curtile.w10;
			let down = curtile.w12;
			let left = curtile.w01;
			let right = curtile.w21;
			const DOWN = {dx:0,dy:1,dir:'down'};
			const UP = {dx:0,dy:-1,dir:'up'};
			const LEFT = {dx:-1,dy:0,dir:'left'};
			const RIGHT = {dx:1,dy:0,dir:'right'};
			let opts = [];
			if(!left) opts.push(LEFT);
			if(!right) opts.push(RIGHT);
			if(!up) opts.push(UP);
			if(!down) opts.push(DOWN);
			return opts;
	}

	Tile.prototype.getTouching = function(){
		let x = this.x;
		let y = this.y;
		let touching = [];
		for(let dx = -1; dx <= 1; dx++){
			for(let dy = -1; dy <= 1;dy++){
				c = grid.getTileAt(x+dx,y+dy);
				if(!c) continue;
				if(c == this) continue;
				let opt = getOpts(this).filter(e=>e.dx==dx&&e.dy==dy);
				if(opt.length == 0) continue;
				opt = opt[0];
				// if(dx == 0 || dy == 0 || false){ // I think the false specifies if you can go diagonal or not (false means no diagonal)
				if(dx == opt.dx && dy == opt.dy) {
					if(c) touching.push(c);
				}
			}
		}
		return touching;
	}

	const heuristic = (a,b) => Vector.distance(a.x,a.y,b.x,b.y);

	function find(s,e){
		start = s;
		end = e;
		if(!pathfind.grid){
			console.error('pathfind.grid is undefined');
			return [];
		}
		open_set = [];
		closed_set = [];
		stack = [];
		open_set.push(start);
		pathfind.grid.forEach(tile=>{ tile.h = heuristic(tile,end); }); // 1st passthrough determines heuristic value for each tile
		finding = true;

		let last;

		while(finding){
			last = step();
		}

		if(!last) return;

		let path = trace(last);

		return stack;
	}

	function step(){
		if(open_set.length > 0){
			let winner = 0;
			for(let i=0;i<open_set.length;i++){
				if(open_set[i].f < open_set[winner].f){
					winner = i;
				}
			}
			current = open_set[winner];
			if(current == end){
				finding = false;
				return end;
			}
			let touching = current.getTouching();
			for(let t of touching){
				if(closed_set.includes(t)) continue;
				let tempg = current.g + 1;
				if(open_set.includes(t)){
					if(tempg < t.g){
						t.g = tempg;
						t.prev = current;
					}
				} else {
					t.g = tempg;
					open_set.push(t);
					t.prev = current;
				}
				// t.h = heuristic(t,end);
				t.f = t.g + t.h;
			}
			open_set.splice(open_set.indexOf(current),1);
			closed_set.push(current);
		} else {
			console.log('Impossible')
			finding = false;
			return;
		}
	}

	function trace(n){
		stack.unshift(n);
		if(n == start) return;
		trace(n.prev);
	}


	pathfind.find = find;
})(pacman);