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
			password: this.model.get("hasPassword"),
			name: options.roomName,
			game: gameName,
			players: this.model.get("players").length,
			status: this.model.get("status"),
			actions: this.getActions()
		};
	}, 

	formatPlayers: function(players){
		var playersString = "";
		_.forEach(players, function(player){
			playersString += `<span style="color:${player.color}">${player.name}</span> `;
		});
		return playersString;
	},

	getActions: function(){
		//Change me later, add spectate option
		//Check if room full
		var actions = "";
		if(this.model.get("maxPlayers") > this.model.get("players").length){
			actions += "<button class='joinRoomBtn' id='joinRoom" + this.model.get("id") +"'>Join Room</button>";
		}
		//if can spectate...
		actions += "<button class='spectateBtn'>Spectate</button>";

		return actions;
	},
	

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

	ui: {
		"joinRoomBtn": ".joinRoomBtn"
	},

	events: {
		"click @ui.joinRoomBtn": "requestJoinRoom"
	},

	onRender: function(){
		var self = this;
		var roomColView = new RoomCollectionView({
			collection: self.model.get("activeRooms")
		});
		this.$el.append(roomColView.$el);
		roomColView.render();
	},

	requestJoinRoom: function(event){
		var btnId = event.target.id;
		var roomId = parseInt(btnId.replace("joinRoom", ""));
		//@TODO: implement passwords
		this.model.joinRoom(roomId, "");
	}
});

module.exports = GameRoomsTableView;
