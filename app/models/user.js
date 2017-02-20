var Backbone = require("backbone");

var User = Backbone.Model.extend({
	initialize: function(){
		if(!io){
			console.error("No socket.io detected!");
			return;
		}
		this.setUpSocket();
	},

	setUpSocket: function(){
		var self = this;
		self.set("socket", io());
		self.get("socket").on("myId", function(value){
			self.set("pid", value);
		});
	}
});

module.exports = User;
