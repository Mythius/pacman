(function(global){
	const KeyShow = {};
	global.KeyShow = KeyShow;
	var imgs = {};
	var rsymbols = ['enter','space','esc','ctrl'];

	KeyShow.Image_Size = 50;
	KeyShow.parentElement = document.body;

	async function load(){
		let promises = [];
		for(let i=97;i<97+26;i++){
			let img = new Image;
			img.src = `tutorial/${String.fromCharCode(i)}.png`;
			img.width = KeyShow.Image_Size;
			promises.push(new Promise(res=>{
				img.onload = function(){
					imgs[String.fromCharCode(i)] = img;
					res();
				}
			}));
		}
		for(let i=1;i<13;i++){
			let img = new Image;
			img.src = `tutorial/f${i}.png`;
			img.width = KeyShow.Image_Size;
			promises.push(new Promise(res=>{
				img.onload = function(){
					imgs[`f${i}`] = img;
					res();
				}
			}));
		}

		for(let i=0;i<10;i++){
			let img = new Image;
			img.src = `tutorial/${i}.png`;
			img.width = KeyShow.Image_Size;
			promises.push(new Promise(res=>{
				img.onload = function(){
					imgs[i] = img;
					res();
				}
			}));
		}

		for(let rsy of rsymbols){
			let img = new Image;
			img.src = `tutorial/${rsy}.png`;
			img.width = KeyShow.Image_Size;
			promises.push(new Promise(res=>{
				img.onload = function(){
					imgs[rsy] = img;
					res();
				}
			}));
		}

		let arrows = new Image;
		arrows.src = 'tutorial/arrowkeys.png';
		arrows.width = KeyShow.Image_Size*3;
		imgs['arrows'] = arrows;

		let wasd = new Image;
		wasd.src = 'tutorial/wasd.png';
		wasd.width = KeyShow.Image_Size*3;
		imgs['wasd'] = wasd;


		return await Promise.all(promises);
	}


	function prompt(key_pattern,action,seconds=3){
		return new Promise((res,rej)=>{
			let element = create('keyshow');
			let icodes = key_pattern.split('+');
			for(let i=0;i<icodes.length;i++){
				let k = icodes[i];
				if(k==''){
					element.appendChild(imgs['+'])
				} else {
					element.appendChild(imgs[k.toLowerCase()]);
				}
				if(i < icodes.length-1){
					element.innerHTML += ' + ';
				} else {
					element.innerHTML += '<br><br>';
				}
			}
			element.innerHTML += action;
			KeyShow.parentElement.appendChild(element);
			setTimeout(()=>{
				element.remove();
				res();
			},seconds*1000)
		});	
	}
	KeyShow.prompt = prompt;
	KeyShow.imgs = imgs;
	KeyShow.load = load;
})(this);

// <link rel='stylesheet' href='tutorial/tutorial.css'>
// <script src="tutorial/tutorial.js"></script>


// KeyShow.load().then( // ready to use ) must call before using
// KeyShow.prompt('wasd','to move')
// KeyShow.prompt('ctrl + s','to save')
// KeyShow.prompt('f','for fullscreen',5) (shows for 5 seconds)
// KeyShow.parentElement = document.body // defaults to here but you can change to append in different element