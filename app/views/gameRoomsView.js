var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var ChatView = require("./chatView");
var GameRoomsTableView = require("./gameRoomsTableView");
var SideBarView = require("./sideBarview");
var CreateRoomView = require("./createRoomView");
var GameRoom = require("../models/gameRoom");

var GameRoomsView = Marionette.View.extend({
	className: "gameRoomsView",
	template: _.template(fs.readFileSync("./app/templates/gameRoomsView.html", "utf8")),
	regions: {
		sideBar: ".sideBar",
		gameRooms: ".gameRooms",
		chat: ".chatView",
		createRoomView: ".createRoomView",
	},

	ui: {
		createRoom: ".createRoom",
	},

	events: {
		"click @ui.createRoom": "showCreateRoomView",
	},

	modelEvents: {
		"change:roomId"	: "showGameRoom"
	},

	initialize: function(){
		this.model.createChatClient();
	},

	onRender: function(){
		var self = this;
		this.showChildView("chat", new ChatView({model: self.model.chatClient}));
		this.showChildView("gameRooms", new GameRoomsTableView({model: self.model}));
		this.showChildView("sideBar", new SideBarView({model: self.model}));
	},

	showCreateRoomView: function(){
		var self = this;
		this.showChildView("createRoomView", new CreateRoomView({model: new GameRoom({user: self.model})}));
	},

	showGameRoom: function(){
		console.log("SHOW");
		//check active games, then render based on the id of self.model.get("roomId")
	}

});


module.exports = GameRoomsView;
