var Backbone = require("backbone");

var User = Backbone.Model.extend({
	initialize: function(){
		if(!io){
			console.error("No socket.io detected!");
			return;
		}
		this.setUpSocket();
	},

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
				self.trigger("change:name");
			}else{
				self.set("error", response.error);
				self.trigger("change:error");
			}
		});
	},

	requestName: function(name){
		this.getSocket().emit("nameRequest", name);
	}
});

module.exports = User;
