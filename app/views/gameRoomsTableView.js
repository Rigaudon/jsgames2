var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var gamesCollection = new Backbone.Collection(require("../../games.json"));

var GameRoomListItem = Marionette.View.extend({
	getTemplate: function(){
		var self = this;
		return _.template(fs.readFileSync("./app/templates/partials/gameRooms/gameRoomListItem.html", "utf8"), self.templateContext());
	},

	tagName: "tr", 
	templateContext: function(){
		var options = this.model.get("options");
		var gameName = gamesCollection.get(options.gameId).get("name");
		return {
			name: options.roomName,
			game: gameName,
			players: this.formatPlayers(this.model.get("players")),
			status: this.model.get("status"),
			actions: "actions"
		};
	},

	formatPlayers: function(players){
		var playersString = "";
		_.forEach(players, function(player){
			playersString += `<span style="color:${player.color}">${player.name}</span> `;
		});
		return playersString;
	}
	
});

var EmptyGameRoomListItem = Marionette.View.extend({
	template: _.template(fs.readFileSync("./app/templates/partials/gameRooms/emptyGameRoomListItem.html", "utf8")),
	tagName: "tr",
});

var RoomCollectionView = Marionette.CollectionView.extend({
	tagName: "tbody",
	className: "roomList",
	childView: GameRoomListItem,
	emptyView: EmptyGameRoomListItem,

});

var GameRoomsTableView = Marionette.View.extend({
	tagName: "table",
	className: "gameRoomsTable",
	template: _.template(fs.readFileSync("./app/templates/partials/gameRooms/gameRoomsTableView.html", "utf8")),

	modelEvents: {
		"change:activeRooms": "render"
	},

	onRender: function(){
		var self = this;
		var roomColView = new RoomCollectionView({
			collection: self.model.get("activeRooms")
		});
		this.$el.append(roomColView.$el);
		roomColView.render();
	}
});

module.exports = GameRoomsTableView;
