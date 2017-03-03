var Backbone = require("backbone");
var ChatMessage = require("./chatMessage");
var emoji = require("node-emoji");

//@TODO: add server messages (eg. Michael joined global, Michael left global, Michael joined x's room)

var ChatClient = Backbone.Model.extend({
	initialize: function(options){
		var self = this;
		this.userModel = options.userModel;
		this.userModel.on("change:roomId", self.updateChannel.bind(self));
		this.socket = options.userModel.getSocket();
		this.messageCollection = new Backbone.Collection();
		this.set("channel", "global");
		this.socket.on("chatMessage", function(value){
			self.addMessage(value);
		});
	},

	sendChatMessage: function(message){ //@TODO: add channels
		message = encodeURIComponent(emoji.emojify(message));
		if(this.validateMessage(message)){
			this.socket.emit("chatMessage", {
				message: message,
				channel: this.get("channel")
			});
		}
	},

	maxMessages: 75,

	addMessage: function(message){
		this.messageCollection.add(new ChatMessage(message));
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
			this.set("channel", "game" + roomId);
		}else{
			this.set("channel", "global");
		}
	}
});

module.exports = ChatClient;
