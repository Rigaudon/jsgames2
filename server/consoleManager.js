var _ = require("lodash");
var md5 = require("md5");

var authenticated = [];

function processMessage(socket, message, mem){
  if (message.args[0] == "authenticate"){
    if (_.includes(authenticated, socket.id)){
      socket.emit("consoleMessage", {
        message: "Already authorized"
      });
    } else if (message.args[1] && md5(message.args[1]) == "1e9bb03464fe66e1e3494c8f44d3528b"){
      authenticated.push(socket.id);
      socket.emit("consoleMessage", {
        message: "Authorization successful"
      });
      return;
    } else {
      socket.emit("consoleMessage", {
        message: "Failed to authorize"
      });
      return;
    }
  }

  if (!_.includes(authenticated, socket.id)){
    socket.emit("consoleMessage", {
      message: "Unauthorized console use"
    });
    return;
  }

  var returnMessage = "";

  switch (message.args[0]){
  case "list_authorized_users":
    returnMessage = authenticatedToString(mem);
    break;
  case "list_all_users":
    returnMessage = getAllUsers(mem);
    break;
  case "list_all_rooms":
    returnMessage = getAllRooms(mem);
    break;
  case "room_details":
    if (message.args[1]){
      var room = mem.rooms.get(message.args[1]);
      if (room){
        returnMessage = "Displaying details of room " + message.args[1] + "\n";
        returnMessage += JSON.stringify(room.toJSON(), null, 4) + "\n";
        returnMessage += JSON.stringify(room.prettifyGameState(), null, 4);
      } else {
        returnMessage = "No room found with id " + message.args[1];
      }
    } else {
      returnMessage = "No room specified";
    }
    break;
  case "help":
    returnMessage = "authorize [user] [auth], list_authorized_users, list_all_users, room_details [roomId], help";
    break;
  default:
    returnMessage = "Unknown server command";
    break;
  }

  socket.emit("consoleMessage", {
    message: returnMessage
  });
}

function authenticatedToString(mem){
  var formatted = "Currently authenticated users:";
  var user;
  _.forEach(authenticated, function(id){
    formatted += "\n" + id;
    user = mem.players.get(id);
    if (user){
      formatted += " | " + user.get("name");
    }
  });
  return formatted;
}

function getAllUsers(mem){
  if (mem.players.models.length == 0){
    return "No online users";
  }
  var formatted = "Online users:";
  _.forEach(mem.players.models, function(model){
    formatted += "\n" + model.id + " | " + model.get("name");
  });
  return formatted;
}

function getAllRooms(mem){
  if (mem.rooms.models.length == 0){
    return "No active gamerooms";
  }
  var formatted = "Active game rooms:";
  var room;

  _.forEach(mem.rooms.models, function(model){
    room = model.toJSON();
    formatted += `\nRoom ID: ${room.id}`;
    formatted += `\n\tRoom Name: ${room.options.roomName}`;
    formatted += `\n\tGame ID: ${room.options.gameId}`;
    formatted += `\n\tStatus: ${room.status}`;
    formatted += `\n\tPlayers: `;

    _.forEach(room.players, function(player){
      formatted += player.id + " | " + player.name + "; ";
    });

    if (room.options.roomPassword){
      formatted += `\n\tPassword: ${room.options.roomPassword}`;
    }
  });
  return formatted;
}

function removeUser(id){
  _.remove(authenticated, function(n){
    return n == id;
  });
}

module.exports = {
  processMessage: processMessage,
  removeUser: removeUser
};
