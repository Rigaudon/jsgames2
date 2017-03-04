var Backbone = require("backbone");
var emoji = require("node-emoji");

var ChatMessage = Backbone.Model.extend({
	initialize: function(data){
		this.set("message", decodeURIComponent(data.message));
		this.set("name", data.name);
		this.set("time", data.time);
		this.set("color", data.color);
		this.set("type", "player");
	},
});

var ServerMessage = Backbone.Model.extend({
	initialize: function(data){
		this.set("type", "server")
		this.set("message", data.message);
		this.set("class", data.class);
	}
});

var ChatClient = Backbone.Model.extend({
	initialize: function(options){
		var self = this;
		this.userModel = options.userModel;
		this.userModel.on("change:roomId", self.updateChannel.bind(self));
		this.socket = options.userModel.getSocket();
		this.messageCollection = new Backbone.Collection();
		this.set("channel", {
			channel: "global",
			display: "Global Chat"
		});
		this.socket.off("chatMessage");
		this.socket.on("chatMessage", function(value){
			self.addMessage(value);
		});
	},

	sendChatMessage: function(message){ //@TODO: add channels
		message = encodeURIComponent(emoji.emojify(message));
		if(this.validateMessage(message)){
			this.socket.emit("chatMessage", {
				message: message,
				channel: this.get("channel").channel
			});
		}
	},

	maxMessages: 75,

	addMessage: function(message){
		if(message.type == "player"){
			this.messageCollection.add(new ChatMessage(message));
		}else if(message.type == "server"){
			this.messageCollection.add(new ServerMessage(message));
		}
		if(this.messageCollection.models.length > this.maxMessages){
			this.messageCollection.shift();
		}
		this.trigger("add:message");
	},

	validateMessage: function(message){
		return message && message.length > 0 && message.length < 200;
	},

	updateChannel: function(){
		var roomId = this.userModel.get("roomId");
		if(roomId){
			//@TODO: use channelName and set it to the game room's name.
			var self = this;
			this.set("channel", {
				channel: "game" + roomId,
				display: self.userModel.get("channelName")
			});
		}else{
			this.set("channel", {
				channel: "global",
				display: "Global Chat"
			});
		}
	}
});

module.exports = ChatClient;
