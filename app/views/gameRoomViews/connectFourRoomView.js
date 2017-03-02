var _ = require("lodash");
var Marionette = require("backbone.marionette");
var ConnectFourClient = require("../../models/connectFourClient");
var fs = require("fs");

var ConnectFourRoomView = Marionette.View.extend({
	initialize: function(options){
		this.player = options.player;
		this.model = new ConnectFourClient({socket: options.player.getSocket()});
	},

	getTemplate: function(){
		return _.template(fs.readFileSync("./app/templates/gameRooms/connectFour.html", "utf8"), this.templateContext());
	},

	className: "connectFourRoom",
	templateContext: function(){
		return {
			opponent: this.model.get("opponentName") || "Waiting for opponent...",
			controls: this.getOptions(),
			roomName: this.model.get("roomName") || "Connect Four",
			id: this.model.get("id"),
			status: this.model.get("status"),
			host: this.model.get("host") ? ( this.model.get("host").name + (this.model.get("isHost") ? " (you)" : "")) : "",
			isHost: this.model.get("isHost"),
			hostControls: this.getHostOptions()
		};
	},

	modelEvents: {
		"update:room": "render"
	},

	ui: {
		"leaveBtn": ".leaveBtn"
	},

	events: {
		"click @ui.leaveBtn": "leaveRoom"
	},

	getOptions: function(){
		return "<button class='leaveBtn btn-big'>Leave Room</button>";
	},

	getHostOptions: function(){
		if(this.model.get("isHost")){
			return "<button>Kick Opponent</button>";
		}else{
			return "";
		}
	},

	leaveRoom: function(){
		this.player.leaveRoom();
	}
});

module.exports = ConnectFourRoomView;
