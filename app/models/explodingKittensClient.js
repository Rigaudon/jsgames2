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
		this.trigger("update:room");
	},

	processGameMessage: function(message){
//		switch(message.message){
//		}
	},

	startRoom: function(){
		this.socket.emit("gameMessage", {
			command: "startGame",
			roomId: this.get("id")
		}); 
	}

});

module.exports = ExplodingKitten;
