var Backbone = require("backbone");

var Room = Backbone.Model.extend({
	
	initialize: function(options){
		this.set("options", options.options);
		this.set("status", "Waiting for Players");
		this.set("players", new Backbone.Collection());
		this.set("hasPassword", options.hasPassword);
		this.set("maxPlayers", options.maxPlayers);
		this.set("gameState", {});
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
		}else{
			if(this.get("host") == playerId){
				var randomPlayer = self.get("players").at(Math.floor(Math.random() * self.get("players").length)).id;
				this.set("host", randomPlayer);	
			}
		}
	},

	sendRoomInfo: function(socket){
		//Overwrite me!
		socket.emit("roomInfo", this.toJSON());
	},

	clientJSON: function(){
		//Overwrite me if necessary!
		var returnObj = {};
		returnObj.hasPassword = this.get("hasPassword");
		returnObj.host = this.get("host");
		returnObj.id = this.get("id");
		returnObj.maxPlayers = this.get("maxPlayers");
		returnObj.status = this.get("status");

		var myOptions = this.get("options");
		returnObj.options = {
			gameId: myOptions.gameId,
			roomName: myOptions.roomName
		};

		var myPlayers = this.get("players").models;
		var players = [];
		for(var i=0; i<myPlayers.length; i++){
			players.push(myPlayers[i].clientJSON());
		}
		returnObj.players = players;

		return returnObj;
	},

	toJSON: function(){
		//Overwrite me if necessary!
		var clientJSON = this.clientJSON();
		clientJSON.options.roomPassword = this.get("options").roomPassword;
		return clientJSON;
	}


});

module.exports = Room;
