var Backbone = require("backbone");
var ChatClient = require("./chatClient.js");

var User = Backbone.Model.extend({
	initialize: function(){
		if(!io){
			console.error("No socket.io detected!");
			return;
		}
		this.setUpSocket();
	},

	//Players are "ready" when they set an acceptable name
	ready: false,

	getSocket: function(){
		return this.get("socket");
	},

	setUpSocket: function(){
		var self = this;
		self.set("socket", io());
		//Getting unique socket id 
		self.getSocket().on("myId", function(value){
			self.set("pid", value);
		});
		//Getting response about name request
		self.getSocket().on("nameRequest", function(response){
			if(response.success){
				self.set("name", response.name);
			}else{
				self.set("error", response.error);
			}
		});
	},

	requestName: function(name){
		this.getSocket().emit("nameRequest", name);
	},

	createChatClient: function(){
		if(!this.get("name") || !this.getSocket()){
			console.error("Could not create chat client without a name.");
		}else{
			this.chatClient = new ChatClient(this.getSocket());
		}
	}
});

module.exports = User;
