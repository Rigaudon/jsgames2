var Backbone = require("Backbone");
var RoomsController = require("./controllers/roomsController");
var UsersController = require("./controllers/usersController");

module.exports = {
	players: new UsersController(),
	rooms: new RoomsController()
};
