var _ = require("lodash");
var Marionette = require("backbone.marionette");
var ExplodingKittensClient = require("../../models/explodingKittensClient");
var fs = require("fs");
var EKCardView = require("./explodingKittensCardView");
var Sortable = require("sortablejs");
var common = require("../../common");

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

	statusCodes: ["Waiting for players", "Waiting to start", ""],

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
			status: this.statusCodes[this.model.get("status")],
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
		"update:room": "render",
		"self:draw": "selfDraw",
		"opponent:draw": "opponentDraw",
		"update:player": "updatePlayer"
	},

	ui: {
		"leaveBtn": ".leaveBtn",
		"startBtn": ".startBtn",
		"deck": ".deck",
		"pile": ".pile",
	},

	regions: {
		"hand": ".heldCards",
		"choose": ".chooseOptions",
		"table": ".playtable"
	},

	events: {
		"click @ui.leaveBtn": "leaveRoom",
		"click @ui.startBtn": "startRoom",
		"click @ui.deck": "drawCard"
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
			this.renderCardCounts();
		}
	},

	renderCards: function(gameState){
		var self = this;
		gameState.hand.forEach(function(card){
			let cardView = new EKCardView({card: card});
			cardView.render();
			$(self.regions.hand).prepend(cardView.$el);
		});
		$(self.regions.hand).sortable({
			animation: 150,
			draggable: ".EKCard",
			group: "hand"
		});
		$(self.ui.pile).sortable({
			animation: 150,
			group: {
				name: "pile",
				put: function(to){
					return $(to.el).find(".EKCard").length == 0;
				}
			},
			onAdd: function(evt){
				var card = evt.item.card;
				switch(card.type){
					case "cat":
						self.onPlayCat(card);
						break;
					case "stf":

					break;
					case "skip":
					case "attack":
					case "shuffle":
					case "favor":

					break;
					case "nope":
					break;
					case "defuse":
					break;
					default:
						throw new Error("Invalid Card Type!");
				}
			}
		});
	},

	onPlayCat: function(card){
		//TODO: check to see if the player has at least two
		var self = this;
		this.showPickPlayerModal(card, function(pid){
			self.model.playCard({
				card: card,
				target: pid
			});
		});
	},

	drawCard: function(){
		//TODO: check if can draw
		this.model.drawCard();
	},

	showPickPlayerModal: function(card, callback){
		var self = this;
		var chooseEl = $(this.regions.choose);
		chooseEl.find(".modal-header").text("Play " + card.name + " on:");
		var bodyEl = chooseEl.find(".modal-body");
		var playerRegions = $(".playtable > .player");
		_.forEach(playerRegions, function(el){
			var playerId = $(el).attr("data-id");
			if(playerId == self.player.get("pid")){
				return;
			}
			var playerEl = $(el).clone();
			playerEl.click(function(){
				chooseEl.modal("hide");
				callback(playerId);
			});
			bodyEl.append(playerEl);
		});

		chooseEl.modal({
			show: true,
			backdrop: false,
			keyboard: true
		});
	},

	renderCardCounts: function(){
		var gameState = this.model.get("gameState");
		if(gameState){
			$(this.ui.deck).find(".numCards").text(gameState.deckCount || "");
			$(this.ui.pile).find(".numCards").text(gameState.pileCount || "");
			this.model.get("players").forEach(function(player, i){
				var playerEl = $(playerSeats[i]);
				var handCountEl = playerEl.find(".numCards");
				handCountEl.text(player.handSize);
			});
		}
	},

	renderPlayers: function(players){
		var self = this;
		players.forEach(function(player, i){ 
			var playerEl = $(playerSeats[i]);
			playerEl.css({
				"border-color": player.color,
				"background-color": player.color
			});
			playerEl.attr("data-id", player.id);
			var playerNameEl = playerEl.find(".playerName");
			playerNameEl.html(player.name);
			player.el = playerEl;
		});
		this.updatePlayer();
	},

	selfDraw: function(card){
		this.model.get("gameState").deckCount--;
		var self = this;
		var me = this.model.get("players").filter(function(player){
			return player.id ==  self.player.get("pid");
		})[0];
		me.handSize++;
		this.addCardToOwnHand(card.card);
		this.renderCardCounts();
		this.animateCardMove(this.ui.deck, ".playerSeat", card.image);
	},

	opponentDraw: function(options){
		let gameState = this.model.get("gameState");
		this.model.get("gameState").deckCount--;
		var opponentId = options.playerId;
		var opponent = this.model.get("players").filter(function(player){
			return player.id == opponentId;
		})[0];
		opponent.handSize++;
		this.renderCardCounts();
		this.animateCardMove(this.ui.deck, opponent.el);
	},

	addCardToOwnHand: function(card){
		this.model.get("gameState").hand.push(card);
		let cardView = new EKCardView({card: card});
		cardView.render();
		$(this.regions.hand).prepend(cardView.$el);
	},

	animateCardMove: function(from, to, card){
		var fromEl = $(this.regions.table).find(from);
		var toEl = $(this.regions.table).find(to);
		var cardEl = $("<img class='animatedCard'>");
		cardEl.attr("src", "/static/images/assets/explodingKittens/" + (card || "back") + ".png");
		cardEl.css({
			left: (fromEl.position().left + (fromEl.outerWidth() - cardEl.outerWidth()) /2) + "px",
			top: (fromEl.position().top  + (fromEl.outerHeight() - cardEl.outerHeight()) /2) + "px"
		});
		$(this.regions.table).append(cardEl);
		cardEl.css({
			left: (toEl.position().left + (toEl.outerWidth() - cardEl.outerWidth()) /2) + "px",
			top: (toEl.position().top  + (toEl.outerHeight() - cardEl.outerHeight()) /2) + "px"
		});

		cardEl.css("opacity", 0);
		cardEl.bind(common.finishTransition, function(){
			if(cardEl.css("opacity") == 0){
				cardEl.remove();	
			}
		});
	},

	updatePlayer: function(newPlayer){
		var gameState = this.model.get("gameState");
		if(gameState && gameState.turnPlayer){
			if(newPlayer){
				gameState.turnPlayer = newPlayer;
			}
			this.model.get("players").forEach(function(player, i){
				if(player.id == gameState.turnPlayer){
					player.el.addClass("active");
				}else{
					player.el.removeClass("active");
				}
			});
		}
	}
});

module.exports = ExplodingKittensRoomView;
