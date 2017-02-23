var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var GameItemView = require("./gameItemView");

var GameCollectionView = Marionette.CollectionView.extend({
	childView: GameItemView,
	tagName: "ul",

	initialize: function(options){
		this.roomModel = options.roomModel;
	},

	onChildviewSelectItem: function(childView){
		this.roomModel.set("game", childView.model.get("name"));
	}
});

module.exports = GameCollectionView;
