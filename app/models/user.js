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
		this.socket = io();
		this.socket.on("myId", function(value){
			this.pid = value;
		});
	}
});

module.exports = User;
