var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var GameRoomListItem = Marionette.View.extend({
	getTemplate: function(){
		var self = this;
		return _.template(fs.readFileSync("./app/templates/gameRoomListItem.html", "utf8"), self.templateContext());
	},

	tagName: "tr", 
	templateContext: function(){
		return {
			name: this.model.get("name"),
			game: this.model.get("gameId"),
			players: this.model.get("players").join(", "),
			status: this.model.get("status"),
			actions: "actions"
		};
	}
	
});

var EmptyGameRoomListItem = Marionette.View.extend({
	template: _.template(fs.readFileSync("./app/templates/emptyGameRoomListItem.html", "utf8")),
	tagName: "tr",
});

var RoomCollectionView = Marionette.CollectionView.extend({
	initialize: function(){
		this.collection = new Backbone.Collection(this.model.get("activeRooms"));
	},
	tagName: "tbody",
	className: "roomList",
	modelEvents: {
		"change:activeRooms": "render"
	},

	childView: GameRoomListItem,
	emptyView: EmptyGameRoomListItem
});

var GameRoomsTableView = Marionette.View.extend({
	tagName: "table",
	className: "gameRoomsTable",
	template: _.template(fs.readFileSync("./app/templates/gameRoomsTableView.html", "utf8")),

	onRender: function(){
		var self = this;
		var roomColView = new RoomCollectionView({model: self.model});
		this.$el.append(roomColView.$el);
		roomColView.render();
	}
});

module.exports = GameRoomsTableView;
