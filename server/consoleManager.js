var _ = require("lodash");

var authenticated = [];

function processMessage(socket, message, mem){
	if(!_.includes(authenticated, socket.id)){
		socket.emit("consoleMessage", {
			message: "Unauthorized console use"
		});
		return;
	}
	switch(message.message){

	}
}

module.exports = {
	processMessage: processMessage
};