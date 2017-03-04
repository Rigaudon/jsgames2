var Backbone = require("backbone");
var ConnectFourClient = Backbone.Model.extend({
	initialize: function(options){
		var self = this;
		this.socket = options.socket;
		this.socket.off("roomInfo");
		this.socket.on("roomInfo", function(roomInfo){
			self.processRoomInfo(roomInfo);
		});
		//We do this instead of the server side event because of the delay it takes to create the view
		this.getRoomInfo();
	},

	getRoomInfo: function(){
		this.socket.emit("requestRoomInfo");
	},

	processRoomInfo: function(roomInfo){
		this.set("host", roomInfo.host);
		this.set("isHost", this.isHost());
		this.set("gameState", roomInfo.gameState);
		this.set("status", roomInfo.status);
		this.set("players", roomInfo.players);
		this.set("opponentName", this.opponentName());
		this.set("roomName", roomInfo.options.roomName);
		this.set("id", roomInfo.id);
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
	},

	isHost: function(){
		return this.get("host") && this.get("host").id == this.socket.id;
	},

	//Below are host functions
	kickOpponent: function(){
		this.socket.emit("gameMessage", {
			command: "kickOpponent",
			roomId: this.get("id")
		});
	},

	startRoom: function(){
		this.socket.emit("gameMessage", {
			command: "startGame",
			roomId: this.get("id")
		});
	}
});

module.exports = ConnectFourClient;
