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
	activeRooms: [],

	getSocket: function(){
		return this.get("socket");
	},

	setUpSocket: function(){
		var self = this;
		self.set("socket", io());
		//Getting unique socket id 
		self.getSocket().on("myId", function(value){
			if(self.get("ready")){
				//Connection was reset; refresh the page.
				location.reload();
			}else{
				self.set("pid", value);
			}
		});
		//Getting response about name request
		self.getSocket().on("nameRequest", function(response){
			if(response.success){
				self.set("name", response.name);
			}else{
				self.set("error", response.error);
			}
		});
		//Initialize/update active game rooms
		self.getSocket().on("activeRooms", function(rooms){
			self.set("activeRooms", rooms);
		});
		//Show disconnection message
		self.getSocket().on("disconnect", function(){
			self.set("disconnected", 1);
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
