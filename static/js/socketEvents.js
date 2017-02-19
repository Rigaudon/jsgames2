var socketEvents = function(io){
	io.on("connection", function(socket){
		socket.emit("myId", socket.id);
	});	
}

module.exports = socketEvents;
