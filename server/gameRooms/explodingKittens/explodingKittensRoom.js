var Room = require("../room");
var _ = require("lodash");
var EKcards = require("./ekcards.json");
var CardObj = require("./card");
var EffectStack = require("./effectStack");

var hostCommands = ["startGame"];
var commands = ["playCard", "drawCard", "giveFavor"];
var STARTING_HAND_CARDS = 5;

var ExplodingKittensRoom = Room.extend({
	initialize: function(options){
		Room.prototype.initialize.call(this, options);
		this.resetDefaultGamestate();
	},

	resetDefaultGamestate: function(){
		this.set("gameState", {
			deck: {},
			hands: {},
			turnPlayer: "undefined"
		});
		if(this.get("players").length == this.get("maxPlayers")){
			this.set("status", 1);
		}else{
			this.set("status", 0);
		}
	},

	playerJoin: function(playerModel){
		Room.prototype.playerJoin.call(this, playerModel);
		if(this.get("players").length == this.get("maxPlayers")){
			this.set("status", 1);
		}
		this.emitToAllExcept(playerModel.id);
	},

	executeCommand: function(options, playerId){
		var self = this;
		var command = options.command;
		options.source = playerId;
		if(commands.indexOf(command) > -1){
			switch(command){
				case "playCard":
					self.playCard(options);
					break;
				case "drawCard":
					self.drawCard(playerId);
					break;
				case "giveFavor":
					self.giveFavor(options);
					break;
				default:
					console.error("Cannot find command " + command);
					break;
			}
		}else if(hostCommands.indexOf(command) > -1 && this.get("host").id == playerId){
			switch(command){
				case "startGame":
					self.startGame();
					break;
			}
		}
	},

	startGame: function(){
		var self = this;
		var players = self.get("players");
		var gameState = self.get("gameState");
		if(players.length >= 2){
				self.set("status", 2);
				gameState.deck = self.initializeDeck(players.length);
				gameState.hands = self.initializeHands();
				self.addExplodingKittens(gameState.deck, players.length);
				gameState.pile = [];
				gameState.exploded = [];
				gameState.turnPlayer = players.at(self.randomIndex(players.length));
				gameState.favor = {};
				gameState.isAttacked = false;
				gameState.isExploding = undefined;
				self.emitToAllExcept();
				self.emitGameMessage({
					"message": "gameStart"
				});
			}
	},

	playCard: function(options){
		/*
		[1] { command: 'playCard',
		[1]   roomId: 1,
		[1]   card: { name: 'Cattermelon', type: 'cat', id: 'cat1', image: 'cat1' },
		[1]   target: 'iW2X-MHU5881e-OVAAAC',
			  source: 'voT8bGaa-nJKzO_0AAAD' }
		*/
		if(this.verifyPlayable(options)){
			var response = {
				"message": "cardPlayed",
				"from": options.source,
				"card": options.card,
				"to": options.target
			};
			this.emitGameMessageToAllExcept([options.source], response);
			response.remove = {
				card: options.card,
				amount: options.card.type == "cat" ? 2 : 1
			};
			this.removeCardsFromHand(options.source, response.remove);
			this.getSocketFromPID(options.source).emit("gameMessage", response);

			var gameState = this.get("gameState");
			gameState.pile.push(options.card);
			if(options.card.type == "cat"){
				gameState.pile.push(options.card);
			}

			if(!gameState.effectStack){
				gameState.effectStack = new EffectStack(options.card, this.performEffect.bind(this, options), {
					onComplete: function(){ gameState.effectStack = undefined; },
					setTimer: this.setTimer.bind(this)
				});
			}else{
				gameState.effectStack.push(options.card, this.performEffect.bind(this, options));
			}
		}else{
			this.getSocketFromPID(options.source).emit("gameMessage", {
				"message": "invalidCard"
			});
		}
	},

	setTimer: function(length){
		this.emitGameMessage({
			"message": "setTimer",
			"length": length
		});
	},

	performEffect: function(options){
		var gameState = this.get("gameState");
		switch(options.card.type){
			case "cat":
				var targetHand = gameState.hands[options.target];
				var randomCard = targetHand.splice(this.randomIndex(targetHand.length) ,1)[0];
				gameState.hands[options.source].push(randomCard);
				var response = {
					"message": "moveCard",
					"from": options.target,
					"to": options.source,
				};
				this.emitGameMessageToAllExcept([options.source, options.target], response);
				response.card = randomCard;
				this.getSocketFromPID(options.source).emit("gameMessage", response);
				this.getSocketFromPID(options.target).emit("gameMessage", response);
				break;
			case "skip":
				this.progressTurn();
				break;
			case "shuffle":
				this.shuffleDeck();
				break;
			case "attack":
				gameState.isAttacked = false;
				this.progressTurn();
				gameState.isAttacked = true;
				break;
			case "stf":
				this.getSocketFromPID(options.source).emit("gameMessage", this.seeTheFuture());
				break;
			case "favor":
				gameState.favor = {
					"source": options.source,
					"target": options.target
				};
				this.emitGameMessage({
					"message": "doFavor",
					"source": options.source,
					"target": options.target
				});
				break;
			case "explode":
				gameState.exploded.push(options.player);
				gameState.isExploding = undefined;
				this.emitGameMessage({
					"message": "exploded",
					"player": options.player
				});
				if(!this.checkWin()){
					gameState.isAttacked = false;
					this.progressTurn();
				}
				break;
			case "defuse":
				if(gameState.isExploding != options.source){
					return;
				}
				this.verifyDeck();
				gameState.isExploding = undefined;
				this.emitGameMessage({
					"message": "defusedExplodingKitten",
					"player": gameState.turnPlayer.get("id")
				});
				this.progressTurn();
				break;
			default:
				console.error("Card type " + options.card.type + " not implemented!");
				break;
		}
	},

	drawCard: function(playerId){
		var gameState = this.get("gameState");
		if(	!this.inProgress() ||
				gameState.turnPlayer.get("id") != playerId ||
				this.isExploded(playerId) ||
				gameState.isExploding ||
				!!gameState.effectStack){
			return;
		}
		var card = gameState.deck.pop();
		if(!card){
			console.error("Tried to draw when the deck was empty");
			return;
		}
		if(card.type == "explode"){
			this.onDrawExplodingKitten(card);
		}else{
			gameState.hands[playerId].push(card);
			this.emitGameMessage({
				"message": "playerDraw",
				"playerId": playerId
			});
			this.getSocketFromPID(playerId).emit("gameMessage", {
				"message": "playerDraw",
				"playerId": playerId,
				"card": card
			});
			this.progressTurn();
		}
	},

	onDrawExplodingKitten: function(card){
		var gameState = this.get("gameState");
		var playerId =  gameState.turnPlayer.get("id");
		this.emitGameMessage({
			"message": "drewExplodingKitten",
			"player": playerId,
			"card": card
		});
		gameState.isExploding = playerId;
		if(!this.handContains(playerId, {type: "defuse"}).length){
			this.performEffect({
				card: card,
				player: playerId
			});
		}else{
			var doExplosion = this.performEffect.bind(this, {
				card: card,
				player: playerId
			});
			var self = this;
			gameState.effectStack = new EffectStack(card, doExplosion, {
				onComplete: function(){ gameState.effectStack = undefined; },
				initialDelay: false,
				delay: 5000,
				setTimer: this.setTimer.bind(this)
			});
		}
	},

	removeCardsFromHand: function(playerId, options){
		for(var i=0; i<options.amount; i++){
			this.removeCardFromHand(playerId, options.card);
		}
	},

	seeTheFuture: function(){
		var cardsToShow = 3;
		var deck = this.get("gameState").deck;
		var currCard = deck.length - 1;
		var response = {
			"message": "seeTheFuture",
			"cards": []
		};
		while(currCard >= 0 && response.cards.length < cardsToShow){
			response.cards.push(deck[currCard].toJSON());
			currCard--;
		}
		return response;
	},

	giveFavor: function(options){
		if(!this.inProgress()){
			return;
		}
		var gameState = this.get("gameState");
		if(	!gameState ||
				gameState.favor.source != options.target ||
				gameState.favor.target != options.source ||
				this.isExploded(options.source) ||
				gameState.isExploding){
			return;
		}
		var removedCard = this.removeCardFromHand(options.source, options.card)[0];
		gameState.hands[options.target].push(removedCard);

		var response = {
			"message": "gaveFavor",
			"from": options.source,
			"to": options.target
		};

		this.emitGameMessageToAllExcept([options.source, options.target], response);
		response.card = options.card;
		this.getSocketFromPID(options.source).emit("gameMessage", response);
		this.getSocketFromPID(options.target).emit("gameMessage", response);
		gameState.favor = {};
	},

	isExploded: function(playerId){
		var gameState = this.get("gameState");
		if(gameState){
			return gameState.exploded.indexOf(playerId) > -1;
		}
		return false;
	},

	removeCardFromHand: function(playerId, card){
		var hand = this.get("gameState").hands[playerId];
		for(var i=0; i<hand.length; i++){
			if(hand[i].id == card.id && hand[i].image == card.image){
				return hand.splice(i, 1);
			}
		}
		throw new Error("Tried to remove a nonexistant card");
	},

	progressTurn: function(){
		if(!this.inProgress()){
			return;
		}
		var players = this.get("players");
		var gameState = this.get("gameState");
		if(gameState.isExploding){
			return false;
		}
		var currTurn = players.indexOf(gameState.turnPlayer);
		if(currTurn > -1){
			if(gameState.isAttacked){
				gameState.isAttacked = false;
			}else{
				for(var i=0; i<players.length; i++){
					currTurn = (currTurn + 1) % players.length;
					var player = players.at(currTurn);
					if(!this.isExploded(player.id)){
						break;
					}
				}
				gameState.turnPlayer = players.at(currTurn);
			}
			this.emitGameMessage({
				message: "playerTurn",
				player: gameState.turnPlayer.id
			});
		}
	},

	playerLeave: function(socket){
		var gameState = this.get("gameState");
		if(gameState.turnPlayer && gameState.turnPlayer.id == socket.id){
			if(!!gameState.effectStack){
				gameState.effectStack.resolveStack();
				gameState.isAttacked = false;
				gameState.isExploding = false;
				gameState.favor = {};
				this.verifyDeck();
			} else {
				gameState.isAttacked = false;
				gameState.isExploding = false;
				gameState.favor = {};
				this.verifyDeck();
				this.progressTurn();
			}
		}
		if(gameState.favor && gameState.favor.target == socket.id){
			gameState.favor = {};
		}
		Room.prototype.playerLeave.call(this, socket);
		this.verifyRoom();
	},

	verifyRoom: function(){
		//verify that the room status matches the gameState
		if(this.get("status") == 2){
			var self = this;
			var gameState = this.get("gameState");
			var activePlayers = this.get("players").filter(function(player){
				return gameState.hands[player.id] && !self.isExploded(player.id);
			});
			if(activePlayers.length < 2){
				this.resetDefaultGamestate();
				this.emitToAllExcept();
			}
		}else{
			this.resetDefaultGamestate();
			this.emitToAllExcept();
		}
	},

	verifyDeck: function(){
		//verify that the appropriate amount of exploding kittens are still in the deck
		if(!this.inProgress()){
			return;
		}
		var self = this;
		var deck = this.get("gameState").deck;
		var inDeck = deck.filter(function(card){
			return card.type == "explode";
		}).length;
		var activePlayers = this.get("players").filter(function(player){
			return self.get("gameState").exploded.indexOf(player.id) == -1;
		});
		var requiredAmount = activePlayers.length - 1;
		while(inDeck < requiredAmount){
			deck.splice(this.randomIndex(deck.length), 0,
				new CardObj(EKcards.explodingKitten, this.randomIndex(EKcards.explodingKitten.num)));
			inDeck++;
		}
	},

	checkWin: function(){
		var gameState = this.get("gameState");
		var nonExploded = this.get("players").filter(function(player){
			return gameState.exploded.indexOf(player.id) == -1;
		});
		if(nonExploded.length == 1){
			this.playerWin(nonExploded[0]);
			return true;
		}else{
			return false;
		}
	},

	playerWin: function(player){
		this.emitGameMessage({
			"message": "playerWin",
			"player": player.id
		});
		this.resetDefaultGamestate();
	},

	randomIndex: function(max){
		//Should this be in a utils file?
		return Math.floor(Math.random() * max);
	},

	verifyPlayable: function(options){
		if(!this.inProgress()){
			return false;
		}
		if(this.isExploded(options.source)){
			return false;
		}
		var gameState = this.get("gameState");
		if(options.card.type != "nope" && options.source != gameState.turnPlayer.id){
			return false;
		}
		if(!!gameState.effectStack){
			if(gameState.effectStack.top().type == "explode"){
				return options.card.type == "defuse";
			}
			if(options.card.type == "defuse"){
				return gameState.effectStack.bottom().type == "explode";
			}
			return options.card.type == "nope";
		}
		if(options.card.type == "nope" || options.card.type == "defuse"){
			return false;
		}
		var inHand = this.handContains(options.source, {
			id: options.card.id,
			image: options.card.image
		});

		if(gameState.isExploding){
			return inHand.length > 0 && (options.card.type == "defuse" || options.card.type == "nope");
		}
		if((options.card.type == "cat" || options.card.type == "favor") && !this.isValidTakeTarget(options.target)){
			return false;
		}
		if(options.card.type == "cat"){
			return inHand.length > 1;
		}

		return inHand.length > 0;
	},

	//Return true if the target has more than one card in hand
	isValidTakeTarget: function(target){
		return this.get("gameState").hands[target].length > 0;
	},

	handContains: function(playerId, keys){
		var hand = this.get("gameState").hands[playerId];
		if(!hand){
			return false;
		}
		return hand.filter(function(card){
			var keepCard = true;
			Object.keys(keys).forEach(function(key){
				if(card[key] != keys[key]){
					keepCard = false;
				}
			});
			return keepCard;
		});
	},

	initializeDeck: function(numPlayers){
		var deck = [];
		var multiplier = numPlayers > 5 ? 2 : 1;
		EKcards.cards.forEach(function(card){
			for(var i=0; i<card.num; i++){
				for(var j=0; j<multiplier; j++){
					deck.push(new CardObj(card, i));
				}
			}
		});
		var defuses = numPlayers == 2 ? 2 : EKcards.defuse.num * multiplier - numPlayers;
		for(var i=0; i<defuses; i++){
			for(var j=0; j<multiplier; j++){
				deck.push(new CardObj(EKcards.defuse, EKcards.defuse.num-i-1));
			}
		}
		return _.shuffle(deck);
	},

	addExplodingKittens: function(deck, numPlayers){
		for(var i=0; i<numPlayers-1; i++){
			deck.push(new CardObj(EKcards.explodingKitten, i));
		}
		this.shuffleDeck();
	},

	shuffleDeck: function(){
		var gameState = this.get("gameState");
		gameState.deck = _.shuffle(gameState.deck);
	},

	initializeHands: function(){
		var hands = {};
		var players = this.get("players");
		var deck = this.get("gameState").deck;
		var i = 0;
		players.each(function(player){
			var hand = [new CardObj(EKcards.defuse, i)];
			while(hand.length < STARTING_HAND_CARDS){
				hand.push(deck.pop());
			}
			hands[player.id] = hand;
			i++;
		});

		return hands;
	},

	gameStateJson: function(gameState, socketId){
		var json = {};
		if(gameState && !_.isEmpty(gameState.hands)){
			json.deckCount = gameState.deck.length;
			json.exploded = gameState.exploded;
			json.hand = gameState.hands[socketId];
			json.pile = gameState.pile;
			json.turnPlayer = gameState.turnPlayer.get("id");
			json.exploded = gameState.exploded;
		}
		return json;
	},

	transformPlayerJson: function(player){
		var gameState = this.get("gameState");
		if(_.get(gameState, "hands[" + player.id + "]")){
			player.handSize = gameState.hands[player.id].length;
		}
		return player;
	}

});

module.exports = ExplodingKittensRoom;
