var GameClient = require("./gameClient");

var CardGameClient = GameClient.extend({
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

  processRoomInfo: function(roomInfo){
    GameClient.prototype.processRoomInfo.call(this, roomInfo);
    this.rotatePlayers();
    this.trigger("update:room");
  },

  actions: {
    playerDraw: function(message){
      if (this.isMe(message.playerId) && message.card){
        this.onSelfDraw(message.card);
        this.trigger("self:draw", {
          card: message.card
        });
      } else if (!this.isMe(message.playerId)){
        this.onOpponentDraw(message.playerId);
        this.trigger("opponent:draw", {
          playerId: message.playerId
        });
      }
    },
    playerTurn: function(message){
      this.onUpdatePlayer(message.player);
      this.trigger("update:player", message.player);
    },
    moveCard: function(message){
      this.onMoveCard(message);
      this.trigger("card:move", message);
    },
    cardPlayed: function(message){
      this.onCardPlayed(message);
      this.trigger("card:played", message);
    },
    gameStart: function(message){
      this.onGameStart(message);
      this.trigger("game:start");
    },
    playerWin: function(message){
      this.onPlayerWin(message);
      this.trigger("player:win", message);
    },
    invalidCard: function(){
      this.trigger("card:invalid");
    },
  },

  onGameStart: function(){
    console.log("Game started");
  },

  playCard: function(options){
    console.log("Playing card");
    console.log(options);
  },

  validatePlayable: function(card){
    console.log(card);
    return true;
  },

  onCardPlayed: function(options){
    console.log("Card played");
    console.log(options);
  },

  onPlayerWin: function(){
    this.set("status", 3);
  },

  removeCardFromHand: function(card){
    var hand = this.get("gameState").hand;
    for (var i = 0; i < hand.length; i++){
      if (hand[i].id == card.id && hand[i].image == card.image){
        hand = hand.splice(i, 1);
        this.getPlayerById(this.socket.id).handSize--;
        return;
      }
    }
    console.error("Tried to remove a card that doesn't exist");
  },

  getCardsInHand: function(card){
    var gameState = this.get("gameState");
    if (gameState && gameState.hand){
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

  drawCard: function(){
    if (this.inProgress() && this.isMyTurn()){
      this.socket.emit("gameMessage", {
        command: "drawCard",
        roomId: this.get("id")
      });
    }
  },

  rotatePlayers: function(){
    var players = this.get("players");
    if (players && players.length){
      while (!this.isMe(players[0].id)){
        players.unshift(players.pop());
      }
    }
  },

  onMoveCard: function(options){
    if (this.isMe(options.to)){
      this.addCardToHand(options.card);
      this.getPlayerById(options.from).handSize--;
    } else if (this.isMe(options.from)){
      this.removeCardFromHand(options.card);
      this.getPlayerById(options.to).handSize++;
    } else {
      this.getPlayerById(options.from).handSize--;
      this.getPlayerById(options.to).handSize++;
    }
  },

  isMyTurn: function(){
    return this.inProgress() && this.get("gameState") && this.isMe(this.get("gameState").turnPlayer);
  },

});

module.exports = CardGameClient;
