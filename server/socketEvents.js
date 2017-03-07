//Handling of SERVER-SIDE io events
var util = require("./socketUtil");
var consoleManager = require("./consoleManager");

var socketEvents = function(io, mem){
	mem.rooms.io = io;
	mem.chat.io = io;

	io.on("connection", function(socket){
		//Join global channel
		socket.join("global");
		//Give out an ID
		socket.emit("myId", socket.id);
		//Give out the current list of rooms
		mem.rooms.emitActiveRooms(socket);

		//Request a name
		socket.on("nameRequest", function(name){
			name = name.trim();
			var response = util.validateName(name, mem, socket);
			if(response.success){
				mem.players.addPlayer({
					id: socket.id,
					name: name,
					color: util.randomColor(),
					socket: socket
				});
			}
			socket.emit("nameRequest", response);
		});
		
		//User disconnected
		socket.on("disconnect", function(){
			mem.rooms.playerLeave(socket);
			mem.players.removePlayer(socket.id);
		});

		//Chat message
		socket.on("chatMessage", function(message){
			var player = mem.players.get(socket.id);
			mem.chat.processMessage(socket, message, player, mem.rooms);
		});

		//Request room creation
		socket.on("createRoom", function(options){
			mem.rooms.validateAndCreate(socket, options);
			//dont need to emit active, because user joins immediately after, which fires emit
		});

		//Request joining a room
		socket.on("joinRoom", function(options){
			var playerModel = mem.players.get(socket.id);
			mem.rooms.joinRoom(socket, options, playerModel);
		});

		//Request info about a room
		socket.on("requestRoomInfo", function(){
			mem.rooms.requestRoomInfo(socket);
		});

		//User requested to leave room
		socket.on("leaveRoom", function(){
			mem.rooms.playerLeave(socket);
		});

		//Game message, delegate to the room
		socket.on("gameMessage", function(options){
			if(options.roomId){
				mem.rooms.executeCommand(options, socket.id);
			}
		});

		//Console message
		socket.on("consoleMessage", function(message){
			consoleManager.processMessage(socket, message, mem);
		});
	});
}

module.exports = socketEvents;
