var Backbone = require("backbone");
var ExplodingKitten = Backbone.Model.extend({
	initialize: function(options){
		var self = this;
		this.player = options.player;
		this.socket = this.player.getSocket();
		this.socket.off("roomInfo");
		this.socket.on("roomInfo", function(roomInfo){
			self.processRoomInfo(roomInfo);
		});
		this.socket.off("gameMessage");
		this.socket.on("gameMessage", function(message){
			self.processGameMessage(message);
		});
		//We do this instead of the server side event because of the delay it takes to create the view
		this.getRoomInfo();
	},

	getRoomInfo: function(){
		this.socket.emit("requestRoomInfo");
	},

	isHost: function(){
		return this.get("host") && this.get("host").id == this.socket.id;
	},

	processRoomInfo: function(roomInfo){
		var self = this;
		Object.keys(roomInfo).forEach(function(val){
			self.set(val, roomInfo[val]);
		});
		this.rotatePlayers();
		this.trigger("update:room");
	},

	processGameMessage: function(message){
		switch(message.message){
			case "playerDraw":
				if(message.playerId == this.socket.id && message.card){
					this.trigger("self:draw", {
						card: message.card
					});
				}else if(message.playerId != this.socket.id){
					this.trigger("opponent:draw", {
						playerId: message.playerId
					});
				}
				break;
			case "playerTurn":
				this.trigger("update:player", message.player);
			break;
		}
	},

	playCard: function(options){
		this.socket.emit("gameMessage", {
			command: "playCard",
			roomId: this.get("id"),
			card: options.card,
			target: options.target
		});
	},

	drawCard: function(){
		if(this.inProgress() && this.isMyTurn()){
			this.socket.emit("gameMessage", {
				command: "drawCard",
				roomId: this.get("id")
			});	
		}
	},

	rotatePlayers: function(){
		var players = this.get("players");
		if(players && players.length){
			while(players[0].id != this.player.get("pid")){
				players.unshift(players.pop());
			}
		}
	},

	startRoom: function(){
		this.socket.emit("gameMessage", {
			command: "startGame",
			roomId: this.get("id")
		}); 
	},

	inProgress: function(){
		return this.get("status") == 2;
	},

	isMyTurn: function(){
		return this.get("gameState") && this.get("gameState").turnPlayer == this.socket.id;
	}

});

module.exports = ExplodingKitten;
