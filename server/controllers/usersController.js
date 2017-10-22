var _ = require("lodash");
var Backbone = require("backbone");
var User = require("../user");

var UsersController = Backbone.Collection.extend({
	addPlayer: function(options){
		this.add(new User(options));
	},

	removePlayer: function(id){
		this.remove(id);
	},

	pickColor: function(id, color){
		if(typeof color == "string" && color.length === 7 && !isNaN(parseInt(color.substring(1), 16)) && color.charAt(0) == "#"){
			this.get(id).set("color", color);
		}
	}
});

module.exports = UsersController;
