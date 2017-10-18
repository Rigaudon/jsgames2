var Room = require("./room");
var _ = require("lodash");
var EKcards = require("./ekcards.json");

var hostCommands = ["startGame"];
var commands = ["playCard", "drawCard"];

var STARTING_HAND_CARDS = 5;

var CardObj = function(card, i) {
	this.name = card.name;
	this.type = card.type;
	this.id = card.id;
	if(card.variableImage){
		this.image = card.id + i;
	}else{
		this.image = card.id;
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
		if(commands.indexOf(command) > -1){
			switch(command){
				case "playCard":
					options.source = playerId;
					self.playCard(options);
					break;
				case "drawCard":
					self.drawCard(playerId);
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
						gameState.isAttacked = false;
						gameState.turnPlayer = players.at(Math.floor(Math.random() * players.length));
						self.emitToAllExcept();
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
		}
		
	},

	performEffect: function(options){
		//wrap this in try/catch?
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
		}
	},

	drawCard: function(playerId){
		//TODO: Check to see if it's exploding kitten
		var gameState = this.get("gameState");
		if(!this.inProgress() || gameState.turnPlayer.get("id") != playerId){
			return;
		}
		var card = gameState.deck.pop(); //Assuming this is possible
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
	},

	removeCardsFromHand: function(playerId, options){
		for(var i=0; i<options.amount; i++){
			this.removeCardFromHand(playerId, options.card);
		}		
	},

	removeCardFromHand: function(playerId, card){
		if(!this.inProgress()){
			return;
		}
		var hand = this.get("gameState").hands[playerId];
		for(var i=0; i<hand.length; i++){
			if(hand[i].id == card.id && hand[i].image == card.image){
				hand = hand.splice(i, 1);
				return;
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
		var currTurn = players.indexOf(gameState.turnPlayer);
		if(currTurn > -1){
			if(gameState.isAttacked){
				gameState.isAttacked = false;
			}else{
				for(var i=0; i<players.length; i++){
					currTurn = (currTurn + 1) % players.length;
					var player = players.at(currTurn);
					if(gameState.exploded.indexOf(player.id) == -1){
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
			this.progressTurn();
		}
		Room.prototype.playerLeave.call(this, socket);
		if(this.get("players").length == 1){
			this.resetDefaultGamestate();
			this.emitToAllExcept();
		}
	},

	verifyPlayable: function(options){
		if(!this.inProgress()){
			return false;
		}
		
		var gameState = this.get("gameState");
		if(options.card.type != "defuse" && options.source != gameState.turnPlayer.id){
			return false;
		}

		var hand = gameState.hands[options.source];
		if(!hand){
			return false;
		}
		var inHand = hand.filter(function(card){
			return card.id == options.card.id && card.image == options.card.image;
		});

		if(options.card.type == "cat"){
			return inHand.length > 1;
		}else{
			return inHand.length > 0;
		}
	},

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
		}
		socket.emit("roomInfo", allJson);
	},

	inProgress: function(){
		return this.get("status") == 2;
	}, 

});

module.exports = ExplodingKittensRoom;
