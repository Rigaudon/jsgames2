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
			hostControls: this.getHostOptions(),
			player: this.player.get("name")
		};
	},

	modelEvents: {
		"update:room": "render"
	},

	ui: {
		"leaveBtn": ".leaveBtn",
		"kickBtn": ".kickBtn",
		"startBtn": ".startBtn"
	},

	events: {
		"click @ui.leaveBtn": "leaveRoom",
		"click @ui.kickBtn": "kickOpponent",
		"click @ui.startBtn": "startRoom"
	},

	getOptions: function(){
		return "<button class='leaveBtn btn-big'>Leave Room</button>";
	},

	getHostOptions: function(){
		var hostOptions = "";
		if(this.model.get("isHost")){
			var players = this.model.get("players");
			if(players.length == 2 && !this.model.get("inProgress")){
				//Add restart option
				hostOptions += "<button class=\"kickBtn btn-big\">Kick Opponent</button>";
				hostOptions += "<button class=\"startBtn btn-big\">Start Game</button>";		
			}
		}
		return hostOptions;
	},

	leaveRoom: function(){
		this.player.leaveRoom();
	},

	kickOpponent: function(){
		this.model.kickOpponent();
	},

	startRoom: function(){
		this.model.startRoom();
	}
});

module.exports = ConnectFourRoomView;
