var Backbone = require("backbone");
var ChatMessage = require("./chatMessage");
var emoji = require("node-emoji");

var ChatClient = Backbone.Model.extend({
	initialize: function(socket){
		var self = this;
		this.socket = socket;
		this.messageCollection = new Backbone.Collection();
		socket.on("chatMessage", function(value){
			self.addMessage(value);
		});
	},

	sendChatMessage: function(message){ //@TODO: add channels
		message = encodeURIComponent(emoji.emojify(message));
		if(this.validateMessage(message)){
			this.socket.emit("chatMessage", {
				message: message,
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
	}
});

module.exports = ChatClient;
