var _ = require("lodash");
var CardGameClient = require("./cardGameClient");

var ExplodingKitten = CardGameClient.extend({
  isExploding: false,
  actions: _.assign({
    gaveFavor: function(message){
      this.onMoveCard(message);
      this.trigger("card:move", message);
    },
    seeTheFuture: function(message){
      this.trigger("effect:stf", message);
    },
    doFavor: function(message){
      this.trigger("do:favor", message);
    },
    drewExplodingKitten: function(message){
      this.onEKDrawn(message);
      this.trigger("ek:drawn", message);
    },
    defusedExplodingKitten: function(message){
      this.onEKDefuse(message);
      this.trigger("ek:defused", message);
    },
    exploded: function(message){
      this.onPlayerExploded(message);
      this.trigger("player:exploded", message);
    },
    setTimer: function(message){
      this.trigger("timer:set", message);
    },
    alterTheFuture: function(message){
      this.trigger("effect:atf", message);
    },
    topdeckImplode: function(){
      this.trigger("topdeck:implode");
    },
    implodingKittenDrawn: function(){
      this.trigger("ik:drawn");
    },
    topdeckSafe: function(){
      this.trigger("topdeck:safe");
    }
  }, CardGameClient.prototype.actions),

  onGameStart: function(){
    this.isExploding = false;
  },

  playCard: function(options){
    if (options.card && this.validatePlayable(options.card)){
      this.socket.emit("gameMessage", {
        command: "playCard",
        roomId: this.get("id"),
        card: options.card,
        target: options.target
      });
    } else {
      this.trigger("card:invalid", {
        card: options.card
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

  alterTheFuture: function(newOrder){
    this.socket.emit("gameMessage", {
      command: "alterTheFuture",
      roomId: this.get("id"),
      newOrder: newOrder
    });
  },

  validatePlayable: function(card){
    //validate that the current player can play this card
    if (!this.inProgress()){
      return false;
    }
    if (card.type != "nope" && !this.isMyTurn()){
      return false;
    }
    if (this.isExploding && ["defuse", "nope"].indexOf(card.type) == -1){
      return false;
    }
    var inHand = this.getCardsInHand(card);
    if (card.type == "cat"){
      return inHand.length > 1;
    } else {
      return inHand.length > 0;
    }
  },

  onEKDefuse: function(){
    this.isExploding = false;

    //The kitten was placed back into deck
    this.get("gameState").deckCount++;
  },

  onPlayerExploded: function(message){
    if (this.isMe(message.player)){
      this.get("gameState").hand = [];
    }
    this.getPlayerById(message.player).handSize = 0;
    if (!this.get("gameState").exploded){
      this.get("gameState").exploded = [];
    }
    this.get("gameState").exploded.push(message.player);
  },

  isExploded: function(player){
    return this.get("gameState").exploded && this.get("gameState").exploded.indexOf(player) > -1;
  },

  onCardPlayed: function(options){
    if (this.isMe(options.from)){
      this.removeCardFromHand(options.card);
      if (options.card.type == "cat"){
        this.removeCardFromHand(options.card);
      }
    } else {
      var p = this.getPlayerById(options.from);
      p.handSize--;
      if (options.card.type == "cat"){
        p.handSize--;
      }
    }
    this.get("gameState").pile.push(options.card);
    if (options.card.type == "cat"){
      this.get("gameState").pile.push(options.card);
    }
  },

  onEKDrawn: function(message){
    this.get("gameState").deckCount--;
    if (this.isMe(message.player)){
      this.isExploding = true;
    }
  },

  onPlayerWin: function(){
    this.isExploding = false;
    this.set("status", 3);
  },
});

module.exports = ExplodingKitten;
