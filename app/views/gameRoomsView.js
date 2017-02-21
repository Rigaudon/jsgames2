var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var ChatView = require("./chatView");
var GameRoomsTableView = require("./gameRoomsTableView");

var GameRoomsView = Marionette.View.extend({
	className: "gameRoomsView",
	template: _.template(fs.readFileSync("./app/templates/gameRoomsView.html", "utf8")),
	regions: {
		gameRooms: ".gameRooms",
		chat: ".chatView"
	},

	initialize: function(){
		this.model.createChatClient();
	},

	onRender: function(){
		var self = this;
		this.showChildView("chat", new ChatView({model: self.model.chatClient}));
		this.showChildView("gameRooms", new GameRoomsTableView({model: self.model}));
	},

});

module.exports = GameRoomsView;
