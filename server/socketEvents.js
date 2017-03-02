//Handling of SERVER-SIDE io events
var util = require("./socketUtil");
var dateFormat = require("dateformat");

var nextMsgId = 0;

var socketEvents = function(io, mem){
	io.on("connection", function(socket){
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
			mem.rooms.playerLeave(io, socket.id);
			mem.players.removePlayer(socket.id);
		});

		//Chat message
		socket.on("chatMessage", function(message){
			if(util.validateMessage(message)){
				io.emit("chatMessage", {
					id: ++nextMsgId,
					message: message.message,
					name: mem.players.get(socket.id).get("name"),
					time: dateFormat(new Date(), "h:MM"),
					color: mem.players.get(socket.id).get("color")
				})
			}
		});

		//Request room creation
		socket.on("createRoom", function(options){
			mem.rooms.validateAndCreate(io, socket, options);
			//dont need to emit active, because user joins immediately after, which fires emit
		});

		//Request joining a room
		socket.on("joinRoom", function(options){
			var playerModel = mem.players.get(socket.id);
			mem.rooms.joinRoom(io, socket, options, playerModel);
		});

		//Request info about a room
		socket.on("requestRoomInfo", function(){
			mem.rooms.requestRoomInfo(socket);
		});

		//User requested to leave room
		socket.on("leaveRoom", function(){
			mem.rooms.playerLeave(io, socket.id);
		});
	});
}

module.exports = socketEvents;
