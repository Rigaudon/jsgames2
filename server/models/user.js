var Backbone = require("backbone");

var User = Backbone.Model.extend({
	clientJSON: function(){
		return {
			color: this.get("color"),
			id: this.get("id"),
			name: this.get("name"),
			room: this.get("room")
		};
	}
});

module.exports = User;
