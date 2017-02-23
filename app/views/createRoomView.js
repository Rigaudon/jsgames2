var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var GameCollectionView = require("./gameCollectionView");

var CreateRoomView = Marionette.View.extend({
	className: "modal-dialog",
	template: _.template(fs.readFileSync("./app/templates/createRoomView.html", "utf8")),

	regions:{
		"gameList": ".gameSelect"
	},

	modelEvents: {
		"change:game": "onGameSelected",
	},

	onRender: function(){
		/*
		var self = this;
		this.showChildView("gameList", new GameCollectionView({ 
			collection: new Backbone.Collection(games),
			roomModel: self.model
		}));
		*/
		this.showChildView("gameList", this.model.showGameCollection());
	},

	onGameSelected: function(){
		console.log("Game set to " + this.model.get("game"));
		//Render new view
	}

});

module.exports = CreateRoomView;
