var Backbone = require("backbone");
var ConnectFourClient = Backbone.Model.extend({
	initialize: function(options){
		var self = this;
		this.socket = options.socket;
		this.socket.on("roomInfo", function(roomInfo){
			console.log(roomInfo);
			self.processRoomInfo(roomInfo);
		});
		this.getRoomInfo();
	},

	getRoomInfo: function(){
		this.socket.emit("requestRoomInfo");
	},

	processRoomInfo: function(roomInfo){
		this.set("host", roomInfo.host);
		this.set("gameState", roomInfo.gameState);
		this.set("status", roomInfo.status);
		this.set("players", roomInfo.players);
		this.set("opponentName", this.opponentName());
		this.set("roomName", roomInfo.options.roomName);
		this.trigger("update:room");
	},

	opponentName: function(){
		var players = this.get("players");
		if(players && players.length == 2){
			if(players[0].id != this.socket.id){
				return players[0].name;
			}else{
				return players[1].name;
			}
		}else{
			return false;
		}
	}
});

module.exports = ConnectFourClient;
