var Room = require("./room");
var _ = require("lodash");

var commands = ["makeMove"];

var ExplodingKittensRoom = Room.extend({
	initialize: function(options){
		Room.prototype.initialize.call(this, options);
	},

	playerJoin: function(playerModel){
		Room.prototype.playerJoin.call(this, playerModel);
		if(this.get("players").length == this.get("maxPlayers")){
			this.set("status", 1);
		}
		this.emitToAllExcept(playerModel.id);
	},
	
	playerLeave: function(playerModel){
		Room.prototype.playerLeave.call(this, playerModel);
		if(this.get("players").length == 1){
			this.set("status", 0);
			this.emitToAllExcept();
		}
	},

	executeCommand: function(options, playerId){
		
	},

	isPlaying: function(){
		return this.get("status") == 2;
	},

	makeMove: function(playerId, col){

	},

});

module.exports = ExplodingKittensRoom;
