function validateName(name, players){
  var returnObj = { success: false };
  if (!name){
    returnObj.error = "Invalid name.";
  } else if (name.length === 0){
    returnObj.error = "Name must not be empty.";
  } else if (name.length > 15){
    returnObj.error = "Name must be shorter than 15 characters.";
  } else if (players.where({ name: name }).length > 0){
    returnObj.error = "Name has already been taken.";
  }
  if (!returnObj.error){
    returnObj.success = true;
    returnObj.name = name;
  }
  return returnObj;
}

function randomColor(){
  color = Math.floor(Math.random() * 16777215).toString(16);
  while (color.length != 6){
    color = "0" + color;
  }
  return "#" + color;
}

function validateMessage(message, socket, io){
  return 	message &&
			message.message &&
			message.message.length > 0 &&
			message.message.length < 200 &&
			message.channel &&
			io.sockets.adapter.rooms[message.channel] &&
			io.sockets.adapter.rooms[message.channel].sockets[socket.id];
}

function validateColor(color){
  return typeof color == "string" && color.length === 7 && !isNaN(parseInt(color.substring(1), 16)) && color.charAt(0) == "#";
}

module.exports = {
  randomColor: randomColor,
  validateMessage: validateMessage,
  validateName: validateName,
  validateColor: validateColor
};
