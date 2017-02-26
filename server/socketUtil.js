var _ = require("lodash");
var games = require("../games.json");
var Backbone = require("backbone");

function validateName(name, mem, socket){
	var returnObj = {success: false};
	if(!name){
		returnObj.error = "Invalid name.";
	}else if(name.length === 0){
		returnObj.error = "Name must not be empty.";
	}else if(name.length > 15){
		returnObj.error = "Name must be shorter than 15 characters.";
	}else if(mem.players.where({ name: name }).length > 0){
		returnObj.error = "Name has already been taken.";
	}
	if(!returnObj.error){
		returnObj.success = true;
		returnObj.name = name;
	}
	return returnObj;
}

function randomColor(){
	color = Math.round(Math.random() * 16777215).toString(16);
	while(color.length != 6){
		color = Math.round(Math.random() * 16777215).toString(16);
	}
	return "#" + color;
}

function validateMessage(message){
	return 	message && 
			message.message &&
			message.message.length > 0 && 
			message.message.length < 200;
}

function addPlayer(name, mem, socket){
	mem.players.add({
		name: name,
		color: randomColor(),
		id: socket.id
	});
}

function removePlayer(mem, socket){
	var player = mem.players.get(socket.id);
	if(player){
		player.unset("room");
	}
	mem.players.remove(socket.id);
}

module.exports = {
	addPlayer: addPlayer,
	randomColor: randomColor,
	removePlayer: removePlayer,
	validateMessage: validateMessage,
	validateName: validateName,
};
