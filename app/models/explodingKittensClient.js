var Backbone = require("backbone");
var _ = require("lodash");
var ExplodingKitten = Backbone.Model.extend({
	initialize: function(options){
		var self = this;
		this.player = options.player;
		this.socket = this.player.getSocket();
		this.socket.off("roomInfo");
		this.socket.on("roomInfo", function(roomInfo){
			self.processRoomInfo(roomInfo);
		});
		this.socket.off("gameMessage");
		this.socket.on("gameMessage", function(message){
			self.processGameMessage(message);
		});
		//We do this instead of the server side event because of the delay it takes to create the view
		this.getRoomInfo();
	},

	onSelfDraw: function(card){
		this.get("gameState").deckCount--;
		this.addCardToHand(card);
	},

	onOpponentDraw: function(id){
		this.get("gameState").deckCount--;
		this.getPlayerById(id).handSize++;
	},

	onUpdatePlayer: function(newPlayer){
		this.get("gameState").turnPlayer = newPlayer;
	},

	getRoomInfo: function(){
		this.socket.emit("requestRoomInfo");
	},

	isHost: function(){
		return this.get("host") && this.get("host").id == this.socket.id;
	},

	processRoomInfo: function(roomInfo){
		var self = this;
		Object.keys(roomInfo).forEach(function(val){
			self.set(val, roomInfo[val]);
		});
		this.rotatePlayers();
		this.trigger("update:room");
	},

	processGameMessage: function(message){
		switch(message.message){
			case "playerDraw":
				if(message.playerId == this.socket.id && message.card){
					this.onSelfDraw(message.card);
					this.trigger("self:draw", {
						card: message.card
					});
				}else if(message.playerId != this.socket.id){
					this.onOpponentDraw(message.playerId);
					this.trigger("opponent:draw", {
						playerId: message.playerId
					});
				}
				break;
			case "playerTurn":
				this.onUpdatePlayer(message.player);
				this.trigger("update:player", message.player);
				break;
			case "moveCard":
			case "gaveFavor":
				this.onMoveCard(message);
				this.trigger("card:move", message);
				break;
			case "cardPlayed":
				this.onCardPlayed(message);
				this.trigger("card:played", message);
				break;
			case "seeTheFuture":
				this.trigger("effect:stf", message);
				break;
			case "doFavor":
				this.trigger("do:favor", message);
				break;
			default:
				console.log("Not implemented:");
				console.log(message);
				break;
		}
	},

	playCard: function(options){
		if(options.card && this.validatePlayable(options.card)){
			this.socket.emit("gameMessage", {
				command: "playCard",
				roomId: this.get("id"),
				card: options.card,
				target: options.target
			});
		}
	},

	giveFavor: function(options){
		this.socket.emit("gameMessage", {
			command: "giveFavor",
			roomId: this.get("id"),
			card: options.card,
			target: options.target
		});
	},

	validatePlayable: function(card){
		//validate that the current player can play this card
		var gameState = this.get("gameState");
		if(card.type != "defuse" && !this.isMyTurn()){
			return false;
		}

		var inHand = this.getCardsInHand(card);
		if(card.type == "cat"){
			return inHand.length > 1;
		}else{
			return inHand.length > 0;
		}
	},

	onCardPlayed: function(options){
		if(options.from == this.socket.id){
			this.removeCardFromHand(options.card);
			if(options.card.type == "cat"){
				this.removeCardFromHand(options.card);
			}
		}else{
			var p = this.getPlayerById(options.from);
			p.handSize--;
			if(options.card.type == "cat"){
				p.handSize--;
			}
		}
		this.get("gameState").pile.push(options.card);
		if(options.card.type == "cat"){
			this.get("gameState").pile.push(options.card);
		}
	},

	removeCardFromHand: function(card){
		var hand = this.get("gameState").hand;
		for(var i=0; i<hand.length; i++){
			if(hand[i].id == card.id && hand[i].image == card.image){
				hand = hand.splice(i, 1);
				this.getPlayerById(this.socket.id).handSize--;
				return;
			}
		}
		console.error("Tried to remove a card that doesn't exist");
	},

	getPlayerById: function(id){
		return this.get("players").filter(function(player){
			return player.id == id;
		})[0];
	},

	getCardsInHand: function(card){
		var gameState = this.get("gameState");
		if(gameState && gameState.hand){
			return gameState.hand.filter(function(handCard){
				return handCard.id == card.id && handCard.image == card.image;
			});
		}
		return [];
	},

	addCardToHand: function(card){
		this.get("gameState").hand.push(card);
		this.getPlayerById(this.socket.id).handSize++;
	},

	onMoveCard: function(options){
		if(options.to == this.socket.id){
			this.addCardToHand(options.card);
			this.getPlayerById(options.from).handSize--;
		}else if(options.from == this.socket.id){
			this.removeCardFromHand(options.card);
			this.getPlayerById(options.to).handSize++;
		}else{
			this.getPlayerById(options.from).handSize--;
			this.getPlayerById(options.to).handSize++;
		}
	},

	drawCard: function(){
		if(this.inProgress() && this.isMyTurn()){
			this.socket.emit("gameMessage", {
				command: "drawCard",
				roomId: this.get("id")
			});
		}
	},

	rotatePlayers: function(){
		var players = this.get("players");
		if(players && players.length){
			while(players[0].id != this.socket.id){
				players.unshift(players.pop());
			}
		}
	},

	startRoom: function(){
		this.socket.emit("gameMessage", {
			command: "startGame",
			roomId: this.get("id")
		});
	},

	inProgress: function(){
		return this.get("status") == 2;
	},

	isMyTurn: function(){
		return this.get("gameState") && this.get("gameState").turnPlayer == this.socket.id;
	}

});

module.exports = ExplodingKitten;
