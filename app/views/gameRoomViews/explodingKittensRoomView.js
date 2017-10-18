var _ = require("lodash");
var Marionette = require("backbone.marionette");
var ExplodingKittensClient = require("../../models/explodingKittensClient");
var fs = require("fs");
var EKCardView = require("./explodingKittensCardView");
var Sortable = require("sortablejs");
var common = require("../../common");
var Promise = require("bluebird");

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

	statusCodes: ["Waiting for players", "Waiting to start", "Game has started"],

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
		"update:player": "updatePlayer",
		"card:move": "moveCard",
		"card:played": "cardPlayed"
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
		"table": ".playtable",
		"status": ".status"
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

	pathForCard: function(card){
		card = card.image ? card.image : card;
		return "/static/images/assets/explodingKittens/" + card + ".png";
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
				put: function(to, from, el){
					var card = el.card;
					switch(card.type){
						case "cat":
							var inHand = gameState.hand.filter(function(handCard){
								return handCard.id == card.id;
							});
							return self.model.isMyTurn() && inHand.length >= 2;
						default:
							return self.model.isMyTurn() && $(to.el).find(".EKCard").length == 0;
					}
					
				}
			},
			onAdd: function(evt){
				var card = evt.item.card;
				$(self.regions.hand).prepend($(self.ui.pile).find(".EKCard").detach());
				switch(card.type){
					case "cat":
						self.onPlayCat(card);
						//put the card back
						break;
					case "stf":
					case "attack":
					case "skip":
					case "shuffle":
						self.onPlay(card);
						break;
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

	onPlay: function(card){
		//No immediate response needed types of cards
		this.model.playCard({
			card: card
		});
	},

	onPlayCat: function(card){
		//TODO: check to see if the player has at least two
		var self = this;
		this.showPickPlayerModal(
			card, 
			function(pid){
				//a player is picked
				self.model.playCard({
					card: card,
					target: pid
				});
			},
			function(){
				//Modal was closed (cancelled or completed)
				$(self.regions.hand).prepend($(self.ui.pile).find(".EKCard").detach());
			}
		);
	},

	drawCard: function(){
		this.model.drawCard();
	},

	cardPlayed: function(options){
		//Render card to top of pile, animate and show status
		var fromEl = this.model.getPlayerById(options.from).el;
		var self = this;
		var player = self.model.getPlayerById(options.from);
		var statusText = player.name + " played " + options.card.name;
		if(options.to){
			statusText += " on " + self.model.getPlayerById(options.to).name;
		}
		$(self.regions.status).text(statusText);
		if(options.remove){
			//remove options.remove.card x options.remove.amount from hand
			self.removeCardFromHand(options.remove.card, options.remove.amount);
		}
		this.animateCardMove(fromEl, this.ui.pile, options.card.image)
		.then(function(){
			//show card image on pile bg
			$(self.ui.pile).css("background-image", "url(" + self.pathForCard(options.card.image) + ")");
		});
	},

	moveCard: function(options){
		var from;
		var to;
		this.model.get("players").map(function(player){
			if(player.id == options.from){
				from = player;
			}
			if(player.id == options.to){
				to = player;
			}
		});
		if(from && to){
			var self = this;
			return this.animateCardMove(from.el, to.el)
			.then(function(){
				if(self.model.socket.id == options.from){
					//remove options.card from hand
					self.removeCardFromHand(options.card, 1);
					//statuses shouldnt be here
					$(self.regions.status).text("You gave " + options.card.name + " to " + to.name + ".");
				}else if(self.model.socket.id == options.to){
					//Add to options.card to hand
					self.addCardToOwnHand(options.card);
					$(self.regions.status).text("You got " + options.card.name + " from " + from.name + ".");
				}else{
					$(self.regions.status).text(to.name + " got a card from " + from.name + ".");
				}
			});
		}
	},

	removeCardFromHand: function(card, amount){
		var removed = 0;
		var cards = $(".EKCard");
		_.forEach(cards, function(cardEl){
			if(removed < amount && cardEl.card && cardEl.card.id == card.id && cardEl.card.image == card.image){
				cardEl.remove();
				removed++;
			}
		});
	},

	showPickPlayerModal: function(card, callback, onCancel){
		var self = this;
		var chooseEl = $(this.regions.choose);
		chooseEl.find(".modal-header").text("Play " + card.name + " on:");
		var bodyEl = chooseEl.find(".modal-body");
		bodyEl.empty();
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
		chooseEl.on("hidden.bs.modal", onCancel.bind(false));
	},

	renderCardCounts: function(){
		this.renderDeckCount();
		this.renderPlayerCardCounts();
	},

	renderDeckCount: function(){
		var gameState = this.model.get("gameState");
		if(gameState){;
			$(this.ui.deck).find(".numCards").text(gameState.deckCount || "");
			$(this.ui.pile).find(".numCards").text(gameState.pile.length || "");
		}
	},

	renderPlayerCardCounts: function(){
		this.model.get("players").forEach(function(player, i){
			var playerEl = $(playerSeats[i]);
			var handCountEl = playerEl.find(".numCards");
			handCountEl.text(player.handSize);
		});
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
		var self = this;
		this.animateCardMove(this.ui.deck, ".playerSeat", card.card.image)
		.then(function(){
			self.addCardToOwnHand(card.card);
		});
		$(this.regions.status).text("You drew a card");
	},

	opponentDraw: function(options){
		var opponentId = options.playerId;
		var opponent = this.model.get("players").filter(function(player){
			return player.id == opponentId;
		})[0];
		var self = this;
		this.animateCardMove(this.ui.deck, opponent.el)
		$(this.regions.status).text(opponent.name + " drew a card");
		this.renderPlayerCardCounts();
	},

	addCardToOwnHand: function(card){
		let cardView = new EKCardView({card: card});
		cardView.render();
		cardView.$el.card = card;
		$(this.regions.hand).prepend(cardView.$el);
		this.renderPlayerCardCounts();
	},

	animateCardMove: function(from, to, card){
		var self = this;
		return new Promise(function(resolve, reject){
			self.renderDeckCount();
			var fromEl = $(self.regions.table).find(from);
			var toEl = $(self.regions.table).find(to);
			var cardEl = $("<img class='animatedCard'>");
			cardEl.attr("src", self.pathForCard(card || "back"));
			cardEl.css({
				left: (fromEl.position().left + (fromEl.outerWidth() - cardEl.outerWidth()) /2) + "px",
				top: (fromEl.position().top  + (fromEl.outerHeight() - cardEl.outerHeight()) /2) + "px"
			});
			$(self.regions.table).append(cardEl);
			cardEl.css({
				left: (toEl.position().left + (toEl.outerWidth() - cardEl.outerWidth()) /2) + "px",
				top: (toEl.position().top  + (toEl.outerHeight() - cardEl.outerHeight()) /2) + "px"
			});

			var toPile = to == self.ui.pile;
			if(!toPile){
				cardEl.css("opacity", 0);
			}
			cardEl.bind(common.finishTransition, function(){
				resolve();
				if(toPile){
					cardEl.remove();	
				}else if(cardEl.css("opacity") == 0){
					cardEl.remove();	
				}
			});
		})
		.then(self.renderPlayerCardCounts.bind(self));
		
	},

	updatePlayer: function(){
		var gameState = this.model.get("gameState");
		if(gameState && gameState.turnPlayer){
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
