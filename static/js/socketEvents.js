//Handling of SERVER-SIDE io events
var util = require("./socketUtil");

var nextMsgId = 0;

var socketEvents = function(io, mem){
	io.on("connection", function(socket){
		//Give out an ID
		socket.emit("myId", socket.id);
		//Give out the current list of rooms
		socket.emit("activeRooms", util.stripRoomPasswords(mem.rooms));

		//Request a name
		socket.on("nameRequest", function(name){
			name = name.trim();
			var response = util.validateName(name, mem, socket);
			if(response.success){
				util.addPlayer(name, mem, socket);
			}
			socket.emit("nameRequest", response);
		});
		
		//User disconnected
		socket.on("disconnect", function(){
			util.removePlayer(mem, socket);
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
			var valid = util.validateRoomOptions(options);
			if(valid.valid){
				var roomInfo = util.createGameRoom(options, mem);
				socket.emit("createRoomResponse", {
					success: true,
					id: roomInfo.id,
					password: roomInfo.password
				});
				io.emit("activeRooms", util.stripRoomPasswords(mem.rooms));
			}else{
				socket.emit("createRoomResponse", {
					success: false,
					message: valid.message
				});
			}
		});
	});
}

module.exports = socketEvents;
