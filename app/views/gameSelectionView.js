var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var GameItemView = require("./gameItemView");

var EmptyView = Marionette.View.extend({

});

var GameSelectionView = Marionette.CollectionView.extend({
	
	tagName: "ul",
	className: "gameSelection",

	initialize: function(){
		this.step = 0;
	},

	childView: GameItemView,

	onChildviewSelectItem: function(childView){
		if(this.step === 0){
			this.step = 1;
			childView.model.set("selected", 1);
			this.setFilter(function(child, index, collection){
				return child.get("selected") === 1;
			});
			this.render();
		}
	}
});

module.exports = GameSelectionView;
