var Backbone = require("backbone");

var Room = Backbone.Model.extend({
	
	defaults: {
		players: new Backbone.Collection(),
		status: "Waiting for players",
		host: ""
	},

	playerJoin: function(playerModel){
		var roomPlayers = this.get("players");
		if(roomPlayers.length == 0){
			this.set("host", playerModel.id);
		}
		roomPlayers.add(playerModel);
	},

	playerLeave: function(playerId){
		var self = this;
		this.get("players").remove(playerId);
		if(this.get("players").length == 0){
			this.collection.remove(self);
		}
	}
});

module.exports = Room;
