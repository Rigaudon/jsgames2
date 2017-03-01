var Room = require("./room");
var _ = require("lodash");

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

	emitToAllExcept: function(playerId){
		var self = this;
		_.forEach(self.get("players").models, function(playerModel){
			if(playerId != playerModel.id){
				self.sendRoomInfo(playerModel.get("socket"));
			}
		});
	}
	

});

module.exports = ConnectFourRoom;
