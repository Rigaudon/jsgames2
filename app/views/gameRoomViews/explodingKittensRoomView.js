var _ = require("lodash");
var Marionette = require("backbone.marionette");
var ExplodingKittensClient = require("../../models/explodingKittensClient");
var fs = require("fs");
var EKCardView = require("./explodingKittensCardView")

var ExplodingKittensRoomView = Marionette.View.extend({
	initialize: function(options){
		this.player = options.player;
		this.model = new ExplodingKittensClient({player: options.player});
		this.player.gameClient = this.model;
	},

	className: "explodingKittensRoom",

	getTemplate: function(){
		return _.template(fs.readFileSync("./app/templates/gameRooms/explodingKittens.html", "utf8"), this.templateContext());
	},

	templateContext: function(){
		return {
			playerNum: this.playerNum(),
			isHost: this.model.isHost(),
			controls: this.getOptions(),
		};
	},

	playerNum: function() {
		var playerNum = "";
		if(this.model && this.model.get("players")){
			switch(this.model.get("players").length){
				case 1:
					playerNum = "onePlayer";
					break;
				case 2: 
					playerNum = "twoPlayers";
					break;
				case 3:
					playerNum = "threePlayers";
					break;
				case 4:
					playerNum = "fourPlayers";
					break;
				case 5: 
					playerNum = "fivePlayers";
					break;
				default:
					throw new Error("Invalid number of players in room");
			}
		}
		return playerNum;
	},

	getOptions: function() {
		var options = "";
		if(this.model.isHost()){
			var players = this.model.get("players");
			if(players.length >= 2 && !this.model.inProgress()){
				//Add restart option
				options += "<button class=\"startBtn btn-big\">Start Game</button>";		
			}
		}
		options += "<button class='leaveBtn btn-big'>Leave Room</button>";
		return options;
	},

	modelEvents: {
		"update:room": "render"
	},

	ui: {
		"leaveBtn": ".leaveBtn",
		"startBtn": ".startBtn"
	},

	regions: {
		"hand": ".heldCards"
	},

	events: {
		"click @ui.leaveBtn": "leaveRoom",
		"click @ui.startBtn": "startRoom",
	},

	leaveRoom: function(){
		this.player.leaveRoom();
	},

	startRoom: function(){
		this.model.startRoom();
	},

	onRender: function(){
		var self = this;
		var gameState = this.model.get("gameState");
		if(gameState && !_.isEmpty(gameState.hand)){
			gameState.hand.forEach(function(card){
				let cardView = new EKCardView({card: card});
				cardView.render();
				$(self.regions.hand).append(cardView.$el);
			});
		}
	},
});

module.exports = ExplodingKittensRoomView;
