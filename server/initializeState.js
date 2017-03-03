var Backbone = require("Backbone");
var RoomsController = require("./controllers/roomsController");
var UsersController = require("./controllers/usersController");
var ChatController = require("./controllers/chatController");

module.exports = {
	chat: new ChatController(),
	players: new UsersController(),
	rooms: new RoomsController()
};
