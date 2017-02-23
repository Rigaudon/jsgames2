var Backbone = require("backbone");
var ChatClient = require("./chatClient.js");
//Hard-coded for now
var games = require("../games.json");

var GameRoom = Backbone.Model.extend({
	showGameCollection: function(){
		var self = this;
		return new GameCollectionView({ 
			collection: new Backbone.Collection(games),
			roomModel: self
		})
	}
});

module.exports = GameRoom;
