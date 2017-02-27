var Backbone = require("backbone");

var Room = Backbone.Model.extend({
	
	initialize: function(options){
		this.set("options", options.options);
		this.set("status", "Waiting for Players");
		this.set("players", new Backbone.Collection());
		this.set("hasPassword", options.hasPassword);
		this.set("maxPlayers", options.maxPlayers);
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
