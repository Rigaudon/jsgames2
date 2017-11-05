var Room = require("../room");

var hostCommands = ["startGame"];
var commands = ["makeGuess"];
var NUM_ROUNDS = 3;
var TURN_TIME = 10000;

var PictionaryRoom = Room.extend({
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
      case "makeGuess":
        self.makeGuess(options);
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

  resetDefaultGamestate: function(){
    this.set("gameState", {
      points: {},
      turnPlayer: undefined,
      turnTimer: undefined,
      word: "test"
    });
  },

  startGame: function(){
    var self = this;
    var players = self.get("players");
    if (players.length >= 3){
      self.set("status", 2);
      self.initializePoints();
      self.initializeTurnOrder();
      self.emitToAllExcept();
      self.progressTurn();
    }
  },

  initializePoints: function(){
    var gameState = this.get("gameState");
    gameState.points = {};
    var players = this.get("players");
    players.forEach(function(player){
      gameState.points[player.get("id")] = 0;
    });
  },

  initializeTurnOrder: function(){
    var players = this.get("players");
    var gameState = this.get("gameState");
    var randomStart = players.at(this.randomIndex(players.length));
    var oneRound = [];
    players.forEach(function(player){
      oneRound.push(player.get("id"));
    });
    while (oneRound[0] != randomStart.get("id")){
      oneRound.unshift(oneRound.pop());
    }
    var turns = [];
    for (var i = 0; i < NUM_ROUNDS; i++){
      turns = turns.concat(oneRound);
    }
    gameState.turns = turns;
  },

  progressTurn: function(){
    var gameState = this.get("gameState");
    if (!this.inProgress()){
      return;
    }
    if (!gameState.turns.length){
      this.endGame();
      return;
    }

    gameState.turnPlayer = this.get("players").get(gameState.turns.pop());
    var newWord = this.getRandomWord();
    gameState.word = newWord;
    var self = this;
    clearTimeout(gameState.turnTimeout);
    gameState.turnTimeout = setTimeout(self.progressTurn.bind(self), TURN_TIME);
    gameState.roundStarted = new Date();
    gameState.correctGuess = [];

    var pid = gameState.turnPlayer.get("id");
    this.emitGameMessageToAllExcept([pid], {
      message: "playerTurn",
      player: pid,
      word: newWord.replace(/[a-zA-Z]/g, " _ ")
    });

    this.getSocketFromPID(pid).emit("gameMessage", {
      message: "playerTurn",
      player: pid,
      word: newWord
    });
  },

  endGame: function(){

  },

  makeGuess: function(options){
    if (!this.inProgress()){
      return;
    }

    var gameState = this.get("gameState");
    if (gameState.turnPlayer.get("id") == options.source || gameState.correctGuess.indexOf(options.source) > -1){
      return;
    }
    if (options.guess.trim().toLowerCase() !== gameState.word.toLowerCase()){
      this.emitGameMessage({
        message: "madeGuess",
        player: options.source,
        guess: options.guess,
        correct: false
      });
    } else {
      var points = this.getPointsForGuess();
      this.emitGameMessage({
        message: "madeGuess",
        player: options.source,
        correct: true,
        points: points
      });
      gameState.points[options.source] += points;
      gameState.correctGuess.push(options.source);
    }
  },

  getPointsForGuess: function(){
    var gameState = this.get("gameState");
    var basePoints = 5;
    var firstBonus = gameState.correctGuess.length ? 0 : 5;
    var timeBonus = Math.round((((new Date()) - gameState.roundStarted) / TURN_TIME) * 10);
    return basePoints + firstBonus + timeBonus;
  },

  getRandomWord: function(){
    return "Test Word";
  },

  gameStateJson: function(gameState, socketId){
    var json = {};
    if (gameState){
      json.points = gameState.points;
      json.turnPlayer = gameState.turnPlayer ? gameState.turnPlayer.get("id") : null;
      json.word = socketId == json.turnPlayer ? gameState.word : gameState.word.replace(/[a-zA-Z]/g, " _ ");
    }
    return json;
  },

  randomIndex: function(max){
    return Math.floor(Math.random() * max);
  },
});

module.exports = PictionaryRoom;
