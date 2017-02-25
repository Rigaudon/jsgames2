var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var GameSelectionView = require("./gameSelectionView");
var games = require("../games.json");

var CreateRoomView = Marionette.View.extend({
	className: "modal-dialog",
	template: _.template(fs.readFileSync("./app/templates/createRoomView.html", "utf8")),

	regions:{
		"gameList": ".gameSelect"
	},

	onRender: function(){
		this.showChildView("gameList", new GameSelectionView({ collection: new Backbone.Collection(games) }));
	},

});

module.exports = CreateRoomView;
