var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var games = require("../../games.json");
var GameItemView = require("./gameItemView");

var GameSelectionItemView = Marionette.View.extend({
	tagName: "li",
	className: "gameSelectionItem",
	getTemplate: function(){
		var self = this;	
		return _.template('<img src="static/images/<%= image%>">', {image: self.model.get("image")});
	},
	triggers: {
		"click": "select:item"
	},
});

var GameSelectionView = Marionette.CollectionView.extend({
	tagName: "ul",
	className: "gameSelectionList",
	childView: GameSelectionItemView,

	initialize: function(options){
		this.gameRoom = options.gameRoom;
		this.selectedChild = undefined;
	}, 

	onChildviewSelectItem: function(childView){
		this.gameRoom.set("game", childView.model.get("id"));
		if(this.selectedChild && this.selectedChild != childView){
			this.selectedChild.$el.removeClass("selected");
		}
		this.selectedChild = childView;
		this.selectedChild.$el.addClass("selected");
	}
});

var CreateRoomView = Marionette.View.extend({
	className: "modal-dialog",
	template: _.template(fs.readFileSync("./app/templates/createRoomView.html", "utf8")),

	regions:{
		"title": ".modalTitle",
		"gameList": ".gameSelection",
		"gameOptions": ".gameOptions"
	},

	modelEvents:{
		"change:game": "renderDetails",
		"close:modal": "closeModal",
	},

	initialize: function(){
		this.games = new Backbone.Collection(games);
	},

	onRender: function(){
		var self = this;
		this.showChildView("gameList", new GameSelectionView({ 
			collection: self.games,
			gameRoom: self.model 
		}));
		$(".createRoomView").on("hidden.bs.modal", function(){
			self.destroy();
		})
	},

	renderDetails: function(){
		var self = this;
		var gameModel = self.games.get(self.model.get("game"));
		this.showChildView("gameOptions", new GameItemView({
			model: self.model,
			gameModel: gameModel
		}));
	},

	closeModal: function(){
		$(this.$el.parent()).modal("hide");
	}

});

module.exports = CreateRoomView;
