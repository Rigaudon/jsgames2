var Room = require("../room");
var _ = require("lodash");
var hostCommands = ["startGame"];
var commands = ["submitCards", "pickSubmission"];
var Cards = require("./cards.json");
var CARDS_IN_HAND = 10;
var VICTORY_POINTS = 5;
var DELAY_AFTER_PICK = 5000;

var CardsAgainstHumanityRoom = Room.extend({
  initialize: function(options){
    Room.prototype.initialize.call(this, options);
    this.resetDefaultGamestate();
  },

  executeCommand: function(options, playerId){
    var self = this;
    var command = options.command;
    options.source = playerId;
    if (commands.indexOf(command) > -1){
      switch (command){
      case "submitCards":
        this.submitCards(options);
        break;
      case "pickSubmission":
        this.pickSubmission(options);
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

  resetDefaultGamestate: function(){
    this.set("gameState", {
      points: {},
      turnPlayer: undefined,
      activeBlackCard: undefined,
      hands: {},
      blackDeck: [],
      whiteDeck: [],
      submitted: [],
      waitingFor: [],
      statusMsg: "Waiting for players"
    });
    if (this.get("players").length == this.get("maxPlayers")){
      this.set("status", 1);
    } else {
      this.set("status", 0);
    }
  },

  startGame: function(){
    var self = this;
    var players = self.get("players");
    if (players.length >= 3){
      self.set("status", 2);
      self.initializePoints();
      self.initializeDecks();
      self.initializeHands();
      self.get("gameState").turnPlayer = players.at(self.randomIndex(players.length));
      self.progressTurn();
    }
  },

  setStatus: function(message){
    this.get("gameState").statusMsg = message;
    this.emitGameMessage({
      "message": "setStatus",
      "status": message
    });
  },

  canPickSubmission: false,
  pickSubmission: function(options){
    if (!this.inProgress() || !this.canPickSubmission){
      return;
    }
    if (options.source != this.get("gameState").turnPlayer.get("id")){
      return;
    }
    var gameState = this.get("gameState");
    gameState.points[options.player]++;
    this.canPickSubmission = false;
    this.emitGameMessage({
      "message": "submissionPicked",
      "player": options.player
    });
    setTimeout(this.progressTurn.bind(this), DELAY_AFTER_PICK);
  },

  submitCards: function(options){
    //options.source submited options.selection (array of indices)
    var gameState = this.get("gameState");
    if ( !this.inProgress() ||
        options.selection.length != gameState.activeBlackCard.pick ||
        gameState.turnPlayer.get("id") == options.source){
      return;
    }

    var hand = gameState.hands[options.source];
    var submission = [];
    options.selection.map(function(i){
      submission.push(hand[i]);
    });
    gameState.submitted.push({
      player: options.source,
      cards: submission
    });

    var newHand = [];
    for (var j = 0; j < hand.length; j++){
      if (options.selection.indexOf(j.toString()) == -1){
        newHand.push(hand[j]);
      }
    }
    gameState.hands[options.source] = newHand;
    _.remove(gameState.waitingFor, function(player){
      return player.get("id") == options.source;
    });
    if (gameState.waitingFor.length){
      this.setStatus(`Waiting for: ${this.waitingForNames()}`);
    } else {
      //Next stage
      this.showAllSubmissions();
    }
  },

  showAllSubmissions: function(){
    var czarName = this.get("gameState").turnPlayer.get("name");
    this.setStatus(`${czarName} is picking.`);
    this.emitGameMessage({
      "message": "listSubmissions",
      "submissions": _.shuffle(this.get("gameState").submitted)
    });
  },

  randomIndex: function(max){
    //Should this be in a utils file?
    return Math.floor(Math.random() * max);
  },

  initializePoints: function(){
    var gameState = this.get("gameState");
    gameState.points = {};
    var players = this.get("players");
    players.forEach(function(player){
      gameState.points[player.get("id")] = 0;
    });
  },

  initializeDecks: function(){
    var gameState = this.get("gameState");
    gameState.blackDeck = _.shuffle(Cards.blackCards);
    gameState.whiteDeck = _.shuffle(Cards.whiteCards);
  },

  initializeHands: function(){
    var players = this.get("players");
    var gameState = this.get("gameState");
    players.forEach(function(player){
      gameState.hands[player.id] = [];
    });
  },

  fillHands: function(){
    if (!this.inProgress()){
      return;
    }
    var players = this.get("players");
    var gameState = this.get("gameState");
    players.forEach(function(player){
      while (gameState.hands[player.id].length < CARDS_IN_HAND){
        gameState.hands[player.id].push(gameState.whiteDeck.pop());
      }
    });
  },

  gameStateJson: function(gameState, socketId){
    var json = {};
    if (gameState && !_.isEmpty(gameState.hands)){
      json.hand = gameState.hands[socketId];
      json.turnPlayer = gameState.turnPlayer.get("id");
      json.points = gameState.points;
      json.activeBlackCard = gameState.activeBlackCard;
      json.statusMsg = gameState.statusMsg;
    }
    return json;
  },

  progressTurn: function(){
    if (this.checkVictory()){
      return;
    }
    var players = this.get("players");
    var gameState = this.get("gameState");
    var nextPlayer = players.at((players.indexOf(gameState.turnPlayer) + 1) % players.length);
    gameState.turnPlayer = nextPlayer;
    gameState.activeBlackCard = gameState.blackDeck.pop();
    var waitingFor = [];
    players.forEach(function(player){
      if (player.get("id") != gameState.turnPlayer.get("id")){
        waitingFor.push(player);
      }
    });
    gameState.waitingFor = waitingFor;
    this.canPickSubmission = true;
    this.get("gameState").submitted = [];
    this.fillHands();
    this.setStatus(`Waiting for: ${this.waitingForNames()}`);
    this.emitToAllExcept();
    this.emitGameMessage({
      "message": "playerTurn",
      "player": gameState.turnPlayer.get("id")
    })
  },

  waitingForNames: function(){
    var names = [];
    this.get("gameState").waitingFor.forEach(function(player){
      names.push(player.get("name"));
    });
    return names.join(", ");
  },

  checkVictory: function(){
    var winner;
    var self = this;
    if (this.get("players").length < 3){
      var max = -1;
      Object.keys(this.get("gameState").points).forEach(function(playerId){
        if (self.get("gameState").points[playerId] > max){
          winner = playerId;
          max = self.get("gameState").points[playerId];
        }
      });
    } else {
      Object.keys(this.get("gameState").points).forEach(function(playerId){
        if (self.get("gameState").points[playerId] >= VICTORY_POINTS){
          winner = playerId;
        }
      });
    }
    if (winner){
      this.resetDefaultGamestate();
      this.emitToAllExcept();
      this.emitGameMessage({
        "message": "playerWin",
        "player": winner
      });
      return true;
    } else {
      return false;
    }
  },

  playerLeave: function(socket){
    var gameState = this.get("gameState");
    if (gameState.turnPlayer && gameState.turnPlayer.get("id") == socket.id){
      this.progressTurn();
    }
    Room.prototype.playerLeave.call(this, socket);
  },

});

module.exports = CardsAgainstHumanityRoom;
