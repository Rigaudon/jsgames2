var Backbone = require("backbone");
var _ = require("lodash");
var CardGameClient = require("./cardGameClient");

var UnoClient = CardGameClient.extend({
  getTopCard: function(){
  	var gameState = this.get("gameState");
  	if(gameState && this.inProgress()){
  		return gameState.pile[gameState.pile.length - 1];
  	}else{
  		return null;
  	}
  },

  playCard: function(options){
    if(options.card && this.validatePlayable(options.card)){
      this.socket.emit("gameMessage", {
        command: "playCard",
        roomId: this.get("id"),
        card: options.card
      });
    }else{
      this.trigger("card:invalid", {
        card: options.card
      });
    }
  },

  validatePlayable: function(card){
  	var gameState = this.get("gameState");
    var inHand = gameState.hand.filter(function(handCard){
      return handCard.type == card.type && handCard.color == card.color;
    });
    var topCard = this.getTopCard();
    if(card.type != "wild" && card.type != "wild4"){
    	if(topCard.type == "wild" || topCard.type == "wild4"){
    		if(card.color != topCard.color){
    			return false;
    		} 
    	}else if(topCard.type == "number" && topCard.value != card.value && topCard.color != card.color){
    		return false;
    	}else if(topCard.type != card.type && topCard.color != card.color){
    		return false;
    	}
    }
    return this.isMyTurn() && inHand.length;
  },

  onCardPlayed: function(options){
    if(this.isMe(options.from)){
      this.removeCardFromHand(options.card);
    }else{
      var p = this.getPlayerById(options.from);
      p.handSize--;
    }
    this.get("gameState").pile.push(options.card);
  },

  onGameStart: function(){
    //console.log("Game started");
  },
});

module.exports = UnoClient;
