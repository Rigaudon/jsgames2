var Backbone = require("Backbone");
var RoomsController = require("./controllers/roomsController");

module.exports = {
	players: new Backbone.Collection(),
	rooms: new RoomsController()
};
