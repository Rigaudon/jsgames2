var _ = require("lodash");
var Marionette = require("backbone.marionette");
var ExplodingKittensClient = require("../../models/explodingKittensClient");
var fs = require("fs");
var EKCardView = require("./explodingKittensCardView");
var Sortable = require("sortablejs");

var playerSeats = [
	'.playerSeat',
	'.playerTwoSeat',
	'.playerThreeSeat',
	'.playerFourSeat',
	'.playerFiveSeat'
];

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
		var numPlayers = this.model && this.model.get("players") ? this.model.get("players").length : 1;
		return {
			playerNum: this.playerClass(numPlayers),
			isHost: this.model.isHost(),
			controls: this.getOptions(),
		};
	},

	playerClass: function(num) {
		switch(num){
			case 1:
				return "onePlayer";
			case 2: 
				return "twoPlayers";
			case 3:
				return "threePlayers";
			case 4:
				return "fourPlayers";
			case 5: 
				return "fivePlayers";
			default:
				throw new Error("Invalid number of players in room");
		}
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
		var gameState = this.model.get("gameState");
		if(this.model.get("players")){
			this.renderPlayers(this.model.get("players"));
		}
		if(gameState && !_.isEmpty(gameState.hand)){
			this.renderCards(gameState);
		}
	},

	renderCards: function(gameState){
		var self = this;
		gameState.hand.forEach(function(card){
			let cardView = new EKCardView({card: card});
			cardView.render();
			$(self.regions.hand).append(cardView.$el);
		});
		$(self.regions.hand).sortable({
			animation: 150
		});
	},

	renderPlayers: function(players){
		players.forEach(function(player, i){ 
			var playerEl = $(playerSeats[i]);
			playerEl.css({
				"border-color": player.color,
				"background-color": player.color
			});
			var playerNameEl = playerEl.find(".playerName");
			playerNameEl.html(player.name);
		});
	}
});

module.exports = ExplodingKittensRoomView;
