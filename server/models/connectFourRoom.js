var Room = require("./room");
var _ = require("lodash");

var hostCommands = ["startGame", "kickOpponent"];
var commands = ["makeMove"];

var ConnectFourRoom = Room.extend({
	initialize: function(options){
		Room.prototype.initialize.call(this, options);
		this.set("gameState", {
			boardState: this.initBoardState()
		})
	},

	initBoardState: function(){
		var boardState = new Array(7);
		for(var i=0; i<boardState.length; i++){
			boardState[i] = new Array(6);
		}
		return boardState;
	},

	playerJoin: function(playerModel){
		Room.prototype.playerJoin.call(this, playerModel);
		if(this.get("players").length == this.get("maxPlayers")){
			this.set("status", "Waiting to start");
		}
		this.emitToAllExcept(playerModel.id);
	},
	
	playerLeave: function(playerModel){
		Room.prototype.playerLeave.call(this, playerModel);
		if(this.get("players").length == 1){
			this.set("status", "Waiting for Players");
			this.emitToAllExcept();
		}
	},

	executeCommand: function(options, playerId){
		var self = this;
		var command = options.command;
		if(commands.indexOf(command) > -1){
			switch(command){
				case "makeMove":

				break;
			}
		}else if(hostCommands.indexOf(command) > -1 && this.get("host").id == playerId){
			switch(command){
				case "startGame":

				break;
				case "kickOpponent":
					var otherPlayer = self.get("players").filter(function(player){ return player.id != playerId; })[0];
					if(otherPlayer){
						self.kickPlayer(otherPlayer);
					}
				break;
			}
		}
	},

	kickPlayer: function(player){
		this.collection.playerLeave(player.get("socket"));
		player.get("socket").emit("leaveRoom");
	}

});

module.exports = ConnectFourRoom;
