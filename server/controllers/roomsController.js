var Backbone = require("backbone");
var Room = require("../models/room");
var _ = require("lodash");
var games = require("../../games.json");
var gamesCollection = new Backbone.Collection(games);

var nextGameRoomId = 0;
var RoomsController = Backbone.Collection.extend({
	emitActiveRooms: function(socket){
		socket.emit("activeRooms", this.withoutPasswords());
	},

	withoutPasswords: function(){
		var self = this;
		var rooms = self.toJSON();
		_.forEach(rooms, function(room){
			delete room.options.roomPassword;
		});
		return rooms;
	},

	validateAndCreate: function(io, socket, options){
		var valid = this.validateRoomOptions(options);
		if(valid.valid){
			var roomInfo = this.createGameRoom(options);
			socket.emit("createRoomResponse", {
				success: true,
				id: roomInfo.id,
				password: roomInfo.password
			});
		}else{
			socket.emit("createRoomResponse", {
				success: false,
				message: valid.message
			});
		}
	},

	validateRoomOptions: function(options){
		var self = this;
		var gameOptions = gamesCollection.get(options.gameId);
		var returnVal = {
			valid: false,
			message: "A server error occured."
		};

		if(gameOptions){
			_.forEach(gameOptions, function(gameOption){
				if(!self.validateRoomOption(gameOption, options[gameOption])){
					return returnVal;
				}
			});
			
			returnVal = {
				valid: true,
				message: ""
			};
		}
		
		return returnVal;
	},

	validateRoomOption: function(option, val){
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
	},

	createGameRoom: function(options){
		this.add(new Room({
			options: options,
			id: ++nextGameRoomId
		}));
		return {
			id: nextGameRoomId,
			password: options.roomPassword
		};
	},

	playerMap: {}, //map player ids to game rooms

	joinRoom: function(io, socket, options, playerModel){
		var room = this.get(options.roomId);
		if(this.validateJoinRoom(socket.id, options, room)){
			this.playerJoin(socket.id, options.roomId, playerModel);
			socket.emit("joinRoomResponse", {
				success: true,
				roomId: options.roomId
			});
			this.emitActiveRooms(io);
		}else{
			socket.emit("joinRoomResponse",{
				success: false
			});
		}
	},

	validateJoinRoom: function(playerId, options, room){
		//Do we care if player is in another room?
		//Probably not...
		return 	room && 
				room.get("options").roomPassword == options.password && 
				!room.get("players").get(playerId) && 
				!this.playerMap[playerId];
	},

	playerJoin: function(playerId, roomId, playerModel){
		var roomModel = this.get(roomId);
		var roomPlayers = roomModel.get("players");
		if(roomPlayers.length == 0){
			roomModel.set("host", playerId);
		}
		roomPlayers.add(playerModel);
		playerModel.set("room", roomId);
		this.playerMap[playerId] = roomModel;
	},

	playerLeave: function(io, playerId){
		var inRoom = this.playerMap[playerId];
		if(inRoom){
			inRoom.playerLeave(playerId);
			delete this.playerMap[playerId];
			this.emitActiveRooms(io);
		}
	}

});

module.exports = RoomsController;
