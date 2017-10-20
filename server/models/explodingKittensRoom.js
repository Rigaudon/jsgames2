var Room = require("./room");
var _ = require("lodash");
var EKcards = require("./ekcards.json");

var hostCommands = ["startGame"];
var commands = ["playCard", "drawCard", "giveFavor"];

var STARTING_HAND_CARDS = 5;

var CardObj = function(card, i) {
	this.name = card.name;
	this.type = card.type;
	this.id = card.id;
	if(card.image){
		this.image = card.image;
	}else{
		if(card.variableImage){
			this.image = card.id + i;
		}else{
			this.image = card.id;
		}
	}

	this.toJSON = function(){
		return {
			name: this.name,
			type: this.type,
			id: this.id,
			image: this.image
		}
	}
};

var ExplodingKittensRoom = Room.extend({
	initialize: function(options){
		Room.prototype.initialize.call(this, options);
		this.resetDefaultGamestate();
	},

	resetDefaultGamestate: function(){
		this.set("gameState", {
			deck: {},
			hands: {},
			turn: "undefined"
		});
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
		var players = self.get("players");
		var gameState = self.get("gameState");
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
					if(players.length >= 2){
						self.set("status", 2);
						gameState.turn = Math.floor(Math.random() * players.length); //Random player starts
						gameState.deck = self.initializeDeck(players.length);
						gameState.hands = self.initializeHands();
						self.addExplodingKittens(gameState.deck, players.length);
						gameState.pile = [];
						gameState.exploded = [];
						gameState.favor = {};
						gameState.isAttacked = false;
						gameState.isExploding = undefined;
						gameState.turnPlayer = players.at(Math.floor(Math.random() * players.length));
						self.emitToAllExcept();
						self.emitGameMessage({
							"message": "gameStart"
						});
					}
					break;
			}
		}
	},

	playCard: function(options){
		//if verify play card, continue with game logic
		//otherwise send response to requester with failed
		/*
		[1] { command: 'playCard',
		[1]   roomId: 1,
		[1]   card: { name: 'Cattermelon', type: 'cat', id: 'cat1', image: 'cat1' },
		[1]   target: 'iW2X-MHU5881e-OVAAAC',
			  source: 'voT8bGaa-nJKzO_0AAAD' }
		*/
		//TODO: create effect stack
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
			this.performEffect(options);

			//This will move
			this.get("gameState").pile.push(options.card);
			if(options.card.type == "cat"){
				this.get("gameState").pile.push(options.card);
			}
		}

	},

	performEffect: function(options){
		var gameState = this.get("gameState");
		switch(options.card.type){
			case "cat":
				var targetHand = gameState.hands[options.target];
				var randomCard = targetHand.splice(Math.floor(targetHand.length * Math.random()), 1)[0];
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
				if(gameState.isAttacked){
					gameState.isAttacked = false;
					this.progressTurn();
				}else{
					this.progressTurn();
					this.get("gameState").isAttacked = true;
				}
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
				break;
			case "defuse":
				//put cat back into deck
				//no longer gameState.isExploding
				//progress turn
				//remember to handle vars on client side too
				break;
			default:
				console.error("Card type " + options.card.type + " not implemented!");
				break;
		}
	},

	drawCard: function(playerId){
		var gameState = this.get("gameState");
		if(!this.inProgress() || gameState.turnPlayer.get("id") != playerId || this.isExploded(playerId) || gameState.isExploding){
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
		if(!this.handContainsType(playerId, "defuse").length){
			this.performEffect({
				card: card,
				player: playerId
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
		if(!gameState || gameState.favor.source != options.target || gameState.favor.target != options.source || this.isExploded(options.source) || gameState.isExploding){
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
						//not exploded, so valid
						break;
					}
				}
				gameState.turnPlayer = players.at(currTurn);
			}
			//emit
			this.emitGameMessage({
				message: "playerTurn",
				player: gameState.turnPlayer.id
			});
		}
	},

	playerLeave: function(socket){
		if(this.get("gameState").turnPlayer && this.get("gameState").turnPlayer.id == socket.id){
			this.verifyDeck();
			this.progressTurn();
		}
		Room.prototype.playerLeave.call(this, socket);
		if(this.get("players").length == 1){
			this.resetDefaultGamestate();
			this.emitToAllExcept();
		}
	},

	verifyDeck: function(){
		//verify that the appropriate amount of exploding kittens are still in the deck
		console.log("IMPLEMENT ME");
	},

	verifyPlayable: function(options){
		if(!this.inProgress()){
			return false;
		}
		var gameState = this.get("gameState");
		if(options.card.type != "nope" && options.source != gameState.turnPlayer.id){
			return false;
		}
		if(this.isExploded(options.source)){
			return false;
		}

		var inHand = this.handContains(options.source, options.card);

		if(gameState.isExploding){
			return inHand.length > 0 && (options.card.type == "defuse" || options.card.type == "nope");
		}
		if(options.card.type == "cat"){
			return inHand.length > 1;
		}else{
			return inHand.length > 0;
		}
	},

	handContains: function(playerId, card){
		//todo: consolidate this with handContainsType
		var hand = this.get("gameState").hands[playerId];
		if(!hand){
			return false;
		}
		return hand.filter(function(c){
			return card.id == c.id && card.image == c.image;
		});
	},

	handContainsType: function(playerId, type){
		var hand = this.get("gameState").hands[playerId];
		if(!hand){
			return false;
		}
		return hand.filter(function(card){
			return card.type == type;
		});
	},
/*	TODO: test me
	handContains: function(playerId, keys){
		var hand = this.get("gameState").hands[playerId];
		if(!hand){
			return false;
		}
		return hand.filter(function(card){
			Object.keys(keys).forEach(function(key){
				if(card[key] != keys[key]){
					return false;
				}
			});
			return true;
		});
	}
*/
	initializeDeck: function(numPlayers){
		var deck = [];
		EKcards.cards.forEach(function(card){
			for(var i=0; i<card.num; i++){
				deck.push(new CardObj(card, i));
			}
		});
		var defuses = numPlayers == 2 ? 2 : EKcards.defuse.num - numPlayers;
		for(var i=0; i<defuses; i++){
			deck.push(new CardObj(EKcards.defuse, EKcards.defuse.num-i-1));
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

	sendRoomInfo: function(socket){
		//TODO: change the clientJSON instead of this function
		var allJson = _.cloneDeep(this.toJSON());
		var gameState = allJson.gameState;
		if(gameState && !_.isEmpty(gameState.hands)){
			gameState.hand = gameState.hands[socket.id];
			gameState.deckCount = gameState.deck.length;
			allJson.players.forEach(function(player, i){
				player.handSize = gameState.hands[player.id].length;
			});
			gameState.turnPlayer = gameState.turnPlayer.get("id");
			delete gameState.hands;
			delete gameState.deck;
			delete gameState.isAttacked;
			delete gameState.favor;
			delete gameState.isExploding;
		}
		socket.emit("roomInfo", allJson);
	},

	inProgress: function(){
		return this.get("status") == 2;
	},

});

module.exports = ExplodingKittensRoom;
