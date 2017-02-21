//Handling of SERVER-SIDE io events
var dateFormat = require("dateformat");

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

	if(mem.playerNames.has(name)){
		returnObj.error = "Name has already been taken.";
	}

	if(mem.players[socket.id]){
		returnObj.error = "Your name has already been assigned.";
	}

	if(!returnObj.error){
		returnObj.success = true;
		returnObj.name = name;
	}
	return returnObj;
}

function addPlayer(name, mem, socket){
	mem.playerNames.add(name);
	mem.players[socket.id] = {
		name: name,
		color: randomColor()
	};
}

function randomColor(){
	color = Math.round(Math.random() * 16777215).toString(16);
	while(color.length != 6){
		color = Math.round(Math.random() * 16777215).toString(16);
	}
	return "#" + color;
}

function removePlayer(mem, socket){
	if(mem.players[socket.id]){
		mem.playerNames.delete(mem.players[socket.id].name);
		delete mem.players[socket.id];
	}
}

function validateMessage(message){
	return 	message && 
			message.message &&
			message.message.length > 0 && 
			message.message.length < 200;
}

var socketEvents = function(io, mem){
	io.on("connection", function(socket){
		//Give out an ID
		socket.emit("myId", socket.id);

		//Request a name
		socket.on("nameRequest", function(name){
			name = name.trim();
			var response = validateName(name, mem, socket);
			if(response.success){
				addPlayer(name, mem, socket);
			}
			socket.emit("nameRequest", response);
		});
		
		//User disconnected
		socket.on("disconnect", function(){
			removePlayer(mem, socket);
		});

		//Chat message
		socket.on("chatMessage", function(message){
			if(validateMessage(message)){
				io.emit("chatMessage", {
					message: message.message,
					name: mem.players[socket.id].name,
					time: dateFormat(new Date(), "h:MM"),
					color: mem.players[socket.id].color
				})
			}
		});
	});
}

module.exports = socketEvents;
