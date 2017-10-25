var Room = require("../room");
var _ = require("lodash");
var hostCommands = ["startGame"];
var commands = ["playCard", "drawCard"];
var STARTING_HAND_CARDS = 7;
var UnoCards = require("./unoCards.json");

var UnoRoom = Room.extend({
  initialize: function(options){
    Room.prototype.initialize.call(this, options);
    this.resetDefaultGamestate();
  },

  resetDefaultGamestate: function(){
    this.set("gameState", {
      deck: {},
      hands: {},
      turnPlayer: null
    });
    if (this.get("players").length == this.get("maxPlayers")){
      this.set("status", 1);
    } else {
      this.set("status", 0);
    }
  },

  playerJoin: function(playerModel){
    Room.prototype.playerJoin.call(this, playerModel);
    if (this.get("players").length == this.get("maxPlayers")){
      this.set("status", 1);
    }
    this.emitToAllExcept(playerModel.id);
  },

  executeCommand: function(options, playerId){
    var self = this;
    var command = options.command;
    options.source = playerId;
    if (commands.indexOf(command) > -1){
      switch (command){
      case "playCard":
        self.playCard(options);
        break;
      case "drawCard":
        self.drawCard(playerId);
        break;
      default:
        console.error("Cannot find command " + command);
        break;
      }
    } else if (hostCommands.indexOf(command) > -1 && this.get("host").id == playerId){
      switch (command){
      case "startGame":
        self.startGame();
        break;
      }
    } else {
      console.error("Cannot find command " + command);
    }
  },

  startGame: function(){
    var self = this;
    var players = self.get("players");
    var gameState = self.get("gameState");
    if (players.length >= 2){
      self.set("status", 2);
      gameState.deck = self.initializeDeck();
      gameState.hands = self.initializeHands();
      gameState.pile = [gameState.deck.pop()];
      gameState.turnPlayer = players.at(self.randomIndex(players.length));
      gameState.direction = 1;
      self.emitToAllExcept();
      self.emitGameMessage({
        "message": "gameStart"
      });
    }
  },

  playCard: function(options){
    if (this.verifyPlayable(options)){
      var response = {
        "message": "cardPlayed",
        "from": options.source,
        "card": options.card,
      };
      this.emitGameMessageToAllExcept([options.source], response);
      response.remove = {
        card: options.card,
        amount: 1
      };
      this.removeCardsFromHand(options.source, response.remove);
      this.getSocketFromPID(options.source).emit("gameMessage", response);
      var gameState = this.get("gameState");
      gameState.pile.push(options.card);
      this.performEffect(options);
    } else {
      this.emitInvalid(options.source);
    }
  },

  emitInvalid: function(playerId){
    this.getSocketFromPID(playerId).emit("gameMessage", {
      "message": "invalidCard"
    });
  },

  drawCard: function(playerId, progress=true){
    var gameState = this.get("gameState");
    if ((!this.inProgress() || gameState.turnPlayer.get("id") != playerId) && progress){
      return;
    }
    if (gameState.deck.length == 0 && gameState.pile.length == 0){
      this.progressTurn();
      return;
    }
    var card = gameState.deck.pop();
    if (!card){
      this.resetDeckFromPile();
      card = gameState.deck.pop();
    }
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
    if (progress){
      if (!this.verifyPlayable({
        source: playerId,
        card: card
      })){
        this.progressTurn();
      }
    }

  },

  resetDeckFromPile: function(){
    var gameState = this.get("gameState");
    var card;
    while (gameState.pile.length > 1){
      card = gameState.pile.shift();
      if (card.type == "wild" || card.type == "wild4"){
        card.color = "wild";
      }
      gameState.deck.push(card);
    }
    this.shuffleDeck();
    this.emitGameMessage({
      "message": "resetDeckFromPile",
      "deckCount": gameState.deck.length
    });
  },

  removeCardsFromHand: function(playerId, options){
    for (var i=0; i<options.amount; i++){
      this.removeCardFromHand(playerId, options.card);
    }
  },

  removeCardFromHand: function(playerId, card){
    var hand = this.get("gameState").hands[playerId];
    for (var i=0; i<hand.length; i++){
      if (hand[i].type == card.type && (hand[i].color == card.color || card.type == "wild" || card.type == "wild4")){
        return hand.splice(i, 1);
      }
    }
    throw new Error("Tried to remove a nonexistant card");
  },

  performEffect: function(options){
    var card = options.card;
    switch (card.type){
    case "wild":
    case "number":
      this.progressTurn();
      break;
    case "skip":
      this.skip();
      break;
    case "draw2":
      this.draw2();
      break;
    case "reverse":
      this.reverse();
      break;
    case "wild4":
      this.wild4();
      break;
    default:
      this.progressTurn();
      break;
    }
    this.checkWin();
  },

  progressTurn: function(){
    if (!this.inProgress()){
      return;
    }
    var gameState = this.get("gameState");
    gameState.turnPlayer = this.playerAfter(gameState.turnPlayer, 1);
    this.emitGameMessage({
      message: "playerTurn",
      player: gameState.turnPlayer.get("id")
    });
  },

  playerAfter: function(player, num){
    var players = this.get("players");
    var gameState = this.get("gameState");
    var currTurn = players.indexOf(player);
    return players.at((currTurn + num * gameState.direction) % players.length);
  },

  skip: function(){
    var gameState = this.get("gameState");
    gameState.turnPlayer = this.playerAfter(gameState.turnPlayer, 2);
    this.emitGameMessage({
      message: "playerTurn",
      player: gameState.turnPlayer.get("id")
    });
  },

  draw2: function(){
    var nextPlayer = this.playerAfter(this.get("gameState").turnPlayer, 1);
    this.drawCard(nextPlayer.get("id"), false);
    this.drawCard(nextPlayer.get("id"), false);
    this.skip();
  },

  reverse: function(){
    if (this.get("players").length == 2){
      this.skip();
    } else {
      this.get("gameState").direction = this.get("gameState").direction * -1;
      this.progressTurn();
    }

  },

  validColors: ["red", "yellow", "green", "blue"],

  wild4: function(){
    var nextPlayer = this.playerAfter(this.get("gameState").turnPlayer, 1);
    this.drawCard(nextPlayer.get("id"), false);
    this.drawCard(nextPlayer.get("id"), false);
    this.drawCard(nextPlayer.get("id"), false);
    this.drawCard(nextPlayer.get("id"), false);
    this.skip();
  },

  playerLeave: function(socket){
    var gameState = this.get("gameState");
    if (gameState.turnPlayer && gameState.turnPlayer.get("id") == socket.id){
      this.progressTurn();
    }
    if (gameState.favor && gameState.favor.target == socket.id){
      gameState.favor = {};
    }
    Room.prototype.playerLeave.call(this, socket);
  },

  checkWin: function(){
    var gameState = this.get("gameState");
    var noCards = this.get("players").filter(function(player){
      return gameState.hands[player.id].length == 0;
    });
    if (noCards.length){
      this.playerWin(noCards[0]);
      return true;
    } else {
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

  verifyPlayable: function(options){
    if (!this.inProgress()){
      return false;
    }
    var gameState = this.get("gameState");
    var inHand = this.handContains(options.source, {
      color: options.card.color,
      type: options.card.type
    });
    var topCard = this.getTopCard();
    if (options.card.type != "wild" && options.card.type != "wild4"){
      if (topCard.type == "wild" || topCard.type == "wild4"){
        if (options.card.color != topCard.color){
          return false;
        }
      } else if (topCard.type == "number" && topCard.value != options.card.value && topCard.color != options.card.color){
        return false;
      } else if (topCard.type != options.card.type && topCard.color != options.card.color){
        return false;
      }
    } else {
      var chosenColor = options.card.color;
      if (!chosenColor || this.validColors.indexOf(chosenColor) == -1){
        return false;
      }
    }

    return gameState.turnPlayer.get("id") == options.source && inHand.length;
  },

  getTopCard: function(){
    var pile = this.get("gameState").pile;
    return pile[pile.length - 1];
  },

  handContains: function(playerId, keys){
    var hand = this.get("gameState").hands[playerId];
    if (!hand){
      return false;
    }
    return hand.filter(function(card){
      var keepCard = true;
      Object.keys(keys).forEach(function(key){
        if ((card.type == "wild" || card.type == "wild4") && key == "color"){
          return;
        }
        if (card[key] != keys[key]){
          keepCard = false;
        }
      });
      return keepCard;
    });
  },

  randomIndex: function(max){
    //Should this be in a utils file?
    return Math.floor(Math.random() * max);
  },

  initializeDeck: function(){
    var deck = [];
    _.forEach(UnoCards.cards, function(card){
      _.forEach(card.colors, function(color){
        for (var i=0; i<card.count; i++){
          if (card.type == "number"){
            for (var cardNum=card.min; cardNum<=card.max; cardNum++){
              deck.push({
                color: color,
                type: card.type,
                value: cardNum,
                image: color + cardNum,
                name: "test"
              });
            }
          } else {
            deck.push({
              color: color,
              type: card.type,
              value: card.type,
              image: color + card.type,
              name: "test"
            });
          }
        }
      });
    });
    return _.shuffle(deck);
  },

  shuffleDeck: function(){
    var gameState = this.get("gameState");
    gameState.deck = _.shuffle(gameState.deck);
  },

  initializeHands: function(){
    var hands = {};
    var players = this.get("players");
    var deck = this.get("gameState").deck;
    players.each(function(player){
      var hand = [];
      while (hand.length < STARTING_HAND_CARDS){
        hand.push(deck.pop());
      }
      hands[player.id] = hand;
    });

    return hands;

  },

  gameStateJson: function(gameState, socketId){
    var json = {};
    if (gameState && !_.isEmpty(gameState.hands)){
      json.deckCount = gameState.deck.length;
      json.hand = gameState.hands[socketId];
      json.pile = gameState.pile;
      json.turnPlayer = gameState.turnPlayer.get("id");
    }
    return json;
  },

  transformPlayerJson: function(player){
    var gameState = this.get("gameState");
    if (_.get(gameState, "hands[" + player.id + "]")){
      player.handSize = gameState.hands[player.id].length;
    }
    return player;
  }

});

module.exports = UnoRoom;
