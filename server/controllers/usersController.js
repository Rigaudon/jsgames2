var _ = require("lodash");
var Backbone = require("backbone");
var User = require("../models/user");

var UsersController = Backbone.Collection.extend({
	addPlayer: function(options){
		this.add(new User(options));
	},

	removePlayer: function(id){
		this.remove(id);
	},
});

module.exports = UsersController;
