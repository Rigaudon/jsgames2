var _ = require("lodash");
var dateFormat = require("dateformat");
var games = require("../../app/games.json");
var Backbone = require("backbone");
var gamesCollection = new Backbone.Collection(games);

var nextGameRoomId = 0;
function createGameRoom(options, mem){
	mem.rooms.add({
		options: options,
		players: new Backbone.Collection(),
		status: "Waiting for players",
		id: ++nextGameRoomId
	});
	return {
		id: nextGameRoomId,
		password: options.roomPassword
	};
}

function validateName(name, mem, socket){
	var returnObj = {
		success: false
	};

	if(!name){
		returnObj.error = "Invalid name.";
	}

	if(name.length === 0){
		returnObj.error = "Name must not be empty.";
	}

	if(name.length > 15){
		returnObj.error = "Name must be shorter than 15 characters.";
	}

	if(mem.players.where({ name: name }).length > 0){
		returnObj.error = "Name has already been taken.";
	}

	if(!returnObj.error){
		returnObj.success = true;
		returnObj.name = name;
	}
	return returnObj;
}

function validateRoomOptions(options){
	var gameOptions = gamesCollection.get(options.gameId);
	var returnVal = {
		valid: false,
		message: "A server error occured."
	};

	if(gameOptions){
		_.forEach(gameOptions, function(gameOption){
			if(!validateRoomOption(gameOption, options[gameOption])){
				return returnVal;
			}
		});
		
		returnVal = {
			valid: true,
			message: ""
		};
	}
	
	return returnVal;
}

function validateRoomOption(option, val){
	switch(option){
		case "roomName":
			return val && val.length > 0 && val.length <= 25;
		case "roomPassword":
			return val && val.length <= 25;
		case "start":
			return true;
		default:
			return false;
	}
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
	mem.players.remove(socket.id);
}

function stripRoomPasswords(rooms){
	//Find a better implementation of this
	//Use lodash pickby?
	var roomsClone = _.cloneDeep(rooms);
	_.forEach(roomsClone.models, function(room){
		var newOptions = room.get("options");
		delete newOptions.roomPassword;
		room.set("options", newOptions);
	});
	return roomsClone;
}

module.exports = {
	addPlayer: addPlayer,
	createGameRoom: createGameRoom,
	randomColor: randomColor,
	removePlayer: removePlayer,
	stripRoomPasswords: stripRoomPasswords,
	validateMessage: validateMessage,
	validateName: validateName,
	validateRoomOptions: validateRoomOptions
};
