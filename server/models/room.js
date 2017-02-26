var Backbone = require("backbone");

var Room = Backbone.Model.extend({
	
	defaults: {
		players: new Backbone.Collection(),
		status: "Waiting for players",
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
