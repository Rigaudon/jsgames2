var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var ChatView = require("./chatView");
var SideBarView = require("./sideBarview");
var GameRoomsView = require("./gameRoomsView");

var ConnectFourRoomView = require("./gameRoomViews/connectFourRoomView");
var UnoRoomView = require("./gameRoomViews/unoRoomView");

var GameRoomViewsMap = {
	"1": ConnectFourRoomView,
	"2": UnoRoomView
};

var LobbyView = Marionette.View.extend({
	className: "lobbyView",
	template: _.template(fs.readFileSync("./app/templates/lobbyView.html", "utf8")),
	regions: {
		main: ".mainView",
		sideBar: ".sideBar",
		chat: ".chatView",
	},

	modelEvents: {
		"change:roomId"	: "onRoomIdChange"
	},

	initialize: function(){
		this.model.createChatClient();
	},

	onRender: function(){
		var self = this;
		this.showChildView("chat", new ChatView({model: self.model.chatClient}));
		this.showChildView("main", new GameRoomsView({model: self.model}));
		this.showChildView("sideBar", new SideBarView({model: self.model}));
	},

	onRoomIdChange: function(){
		var roomId = this.model.get("roomId");
		if(roomId){
			//User joined a room
			this.showGameRoom(roomId);
		}else{
			//Disable game messages since we left the room.
			//Although technically we shouldn't be receiving any, since user is no longer in the room
			this.model.getSocket().off("gameMessage");
			//User left a room; show the root view.
			var mainView = this.$(this.regions.main);
			var self = this;
			common.fadeOutThenIn(mainView, function(){
				self.showChildView("main", new GameRoomsView({model: self.model}));
			});
		}
	},

	showGameRoom: function(roomId){
		//check active games, then render based on the id of self.model.get("roomId")		
		var activeRoom = this.model.get("activeRooms").get(roomId);
		var self = this;
		var mainView = this.$(this.regions.main);
		if(activeRoom){
			common.fadeOutThenIn(mainView, function(){
				self.showChildView("main", new GameRoomViewsMap[activeRoom.get("options").gameId]({
					player: self.model
				}));
			});
		}else{
			//@TODO: show error
			self.model.chatClient.addMessage({
				type: "server",
				class: "error",
				message: "Failed to find room."
			});
		}
	}

});


module.exports = LobbyView;
