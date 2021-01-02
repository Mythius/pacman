const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

var pingstack = [];

exports.onmessage = onmessage;
exports.stack = pingstack;
exports.send = send;

const port = 41234;

var CALLBACK;

socket.bind(port);

function onmessage(callback){
	CALLBACK = callback;
}

function send(msg,address,p=port){
	socket.send(msg,p,address);
}

socket.on('message',(msg,info)=>{
	pingstack.push(info);
	if(!CALLBACK) return;
	let remsg = CALLBACK(msg.toString());
	if(remsg){
		socket.send(remsg,info.port,info.address);
	}
});