var Backbone = require("backbone");

var ChatMessage = Backbone.Model.extend({
	initialize: function(data){
		this.set("message", decodeURIComponent(data.message));
		this.set("name", data.name);
		this.set("time", data.time);
		this.set("color", data.color);
		//@TODO: add recipient and channel
	},
});

module.exports = ChatMessage;
