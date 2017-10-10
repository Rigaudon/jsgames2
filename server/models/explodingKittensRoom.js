var Room = require("./room");
var _ = require("lodash");
var EKcards = require("./ekcards.json");

var hostCommands = ["startGame"];
var commands = ["makeMove"];

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
	
	playerLeave: function(playerModel){
		Room.prototype.playerLeave.call(this, playerModel);
		if(this.get("players").length == 1){
			this.set("status", 0);
			this.emitToAllExcept();
		}
	},

	executeCommand: function(options, playerId){
		var self = this;
		var command = options.command;
		var players = self.get("players");
		var gameState = self.get("gameState");
		if(hostCommands.indexOf(command) > -1 && this.get("host").id == playerId){
			switch(command){
				case "startGame":
					if(players.length >= 2){
						self.set("status", 2);
						gameState.turn = Math.floor(Math.random() * players.length); //Random player starts
						gameState.deck = self.initializeDeck(players.length);
						gameState.hands = self.initializeHands();
						self.emitToAllExcept();
						self.progressTurn();
					}
				break;
			}
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
		for(var i=0; i<numPlayers-1; i++){
			deck.push(new CardObj(EKcards.explodingKitten, i));
		}
		return _.shuffle(deck);
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
			delete gameState.hands;
			delete gameState.deck;
		}
		socket.emit("roomInfo", allJson);
	},

	isPlaying: function(){
		return this.get("status") == 2;
	},

	makeMove: function(playerId, col){

	},

	progressTurn: function(){

	}

});

module.exports = ExplodingKittensRoom;
