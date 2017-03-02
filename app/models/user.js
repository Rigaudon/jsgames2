var Backbone = require("backbone");
var ChatClient = require("./chatClient.js");

var User = Backbone.Model.extend({
	initialize: function(){
		this.set("activeRooms", new Backbone.Collection());
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
			self.set("activeRooms", new Backbone.Collection(rooms));
		});
		//Show disconnection message
		self.getSocket().on("disconnect", function(){
			self.set("disconnected", 1);
		});
		//Response for joining a room
		self.getSocket().on("joinRoomResponse", function(response){
			if(response.success){
				self.set("roomId", response.roomId);
			}else{
				//@TODO: show error
			}
		});
		//Kicked from room
		self.getSocket().on("leaveRoom", function(){
			self.unset("roomId");
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
	},

	joinRoom: function(roomId, password){
		this.getSocket().emit("joinRoom", {
			roomId: roomId,
			password: password
		});
	},

	leaveRoom: function(){
		this.getSocket().emit("leaveRoom");
		//Don't need to wait for response
		this.unset("roomId");
	}
});

module.exports = User;
