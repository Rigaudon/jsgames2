var Room = require("../room");

var hostCommands = ["startGame"];
var commands = ["makeGuess", "setTool", "partialTransaction", "endTransaction", "fill", "undo", "clear"];
var NUM_ROUNDS = 3;
var TURN_TIME = 60000;
var DELAY_BETWEEEN_TURNS = 5000;
var words = require("./words.json");

var PictionaryRoom = Room.extend({
  initialize: function(options){
    Room.prototype.initialize.call(this, options);
    this.resetDefaultGamestate();
    this.wordList = words.easy.concat(words.medium).concat(words.hard);
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
      case "setTool":
        self.setTool(options);
        break;
      case "partialTransaction":
        self.partialTransaction(options);
        break;
      case "endTransaction":
        self.endTransaction(options);
        break;
      case "fill":
        self.fill(options);
        break;
      case "undo":
        self.undo(options);
        break;
      case "clear":
        self.clear(options);
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
      self.initializeTurnOrder();
      self.emitToAllExcept();
      self.get("gameState").usedWords = [];
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
    while (!gameState.turnPlayer && gameState.turns.length) {
      gameState.turnPlayer = this.get("players").get(gameState.turns.pop());
    }

    if (!gameState.turnPlayer){
      this.endGame();
      return;
    }

    var newWord = this.getRandomWord();
    gameState.word = newWord;
    var self = this;
    clearTimeout(gameState.turnTimeout);
    gameState.turnTimeout = setTimeout(self.endTurn.bind(self), TURN_TIME);
    gameState.turnStarted = Date.now();
    gameState.correctGuess = [];

    var pid = gameState.turnPlayer.get("id");
    this.emitGameMessageToAllExcept([pid], {
      message: "playerTurn",
      player: pid,
      word: this.obscureWord(newWord),
      turnEnds: gameState.turnStarted + TURN_TIME
    });

    this.getSocketFromPID(pid).emit("gameMessage", {
      message: "playerTurn",
      player: pid,
      word: newWord,
      turnEnds: gameState.turnStarted + TURN_TIME
    });
  },

  obscureWord: function(word){
    return word.split(" ").map(function(single){
      return single.replace(/[a-zA-Z]/g, " _ ");
    }).join("&nbsp;&nbsp;&nbsp;");
  },

  endTurn: function(playerLeaving = false){
    if (!this.inProgress()){
      return;
    }
    var gameState = this.get("gameState");
    var nextPlayer = gameState.turns.length ? gameState.turns[gameState.turns.length - 1] : null;
    while (!nextPlayer && gameState.turns.length){
      nextPlayer = gameState.turns.pop();
      if (this.get("players").get(nextPlayer)){
        break;
      } else {
        nextPlayer = null;
        continue;
      }
    }
    clearTimeout(gameState.turnTimeout);

    this.emitGameMessage({
      message: "endTurn",
      nextPlayer: nextPlayer,
      word: gameState.word
    });
    if (this.get("players").length < 3 || (playerLeaving && this.get("players").length < 4)){
      this.endGame();
    } else {
      var self = this;
      setTimeout(self.progressTurn.bind(self), DELAY_BETWEEEN_TURNS);
    }
  },

  endGame: function(){
    if (!this.inProgress()){
      return;
    }
    var winningPoints = 0;
    var winners = [];
    var gameState = this.get("gameState");
    this.get("players").forEach(function(player){
      var playerPoints = gameState.points[player.get("id")];
      if (playerPoints > winningPoints){
        winningPoints = playerPoints;
        winners = [player.get("id")];
      } else if (playerPoints == winningPoints){
        winners.push(player.get("id"));
      }
    });
    this.resetDefaultGamestate();
    this.emitToAllExcept();
    this.emitGameMessage({
      message: "endGame",
      winners: winners
    });
  },

  makeGuess: function(options){
    if (!this.inProgress()){
      return;
    }

    var gameState = this.get("gameState");
    if (gameState.turnPlayer.get("id") == options.source || gameState.correctGuess.indexOf(options.source) > -1){
      return;
    }
    if ((new Date()) - gameState.turnStarted > TURN_TIME){
      //cannot guess after turn has ended
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
      var drawerPoints = 5;
      this.emitGameMessage({
        message: "madeGuess",
        player: options.source,
        correct: true,
        points: points,
        drawerPoints: drawerPoints
      });
      gameState.points[gameState.turnPlayer.get("id")] += drawerPoints;
      gameState.points[options.source] += points;
      gameState.correctGuess.push(options.source);
    }
    if (gameState.correctGuess.length == this.get("players").length - 1){
      this.endTurn();
    }
  },

  getPointsForGuess: function(){
    var gameState = this.get("gameState");
    var basePoints = 5;
    var firstBonus = gameState.correctGuess.length ? 0 : 5;
    var timeBonus = Math.round((1 - (((new Date()) - gameState.turnStarted) / TURN_TIME)) * 10);
    return basePoints + firstBonus + timeBonus;
  },

  getRandomWord: function(){
    var randomWord = this.wordList[this.randomIndex(this.wordList.length)];
    while (this.get("gameState").usedWords.indexOf(randomWord) > -1){
      randomWord = this.wordList[this.randomIndex(this.wordList.length)];
    }
    this.get("gameState").usedWords.push(randomWord);
    return randomWord;
  },

  setTool: function(options){
    if (!this.inProgress() || options.source != this.get("gameState").turnPlayer.get("id")){
      return;
    }
    this.emitGameMessageToAllExcept([options.source], {
      message: "setTool",
      tool: options.tool
    });
  },

  partialTransaction: function(options){
    if (!this.inProgress() || options.source != this.get("gameState").turnPlayer.get("id")){
      return;
    }
    this.emitGameMessageToAllExcept([options.source], {
      message: "partialTransaction",
      buffer: options.buffer
    });
  },

  endTransaction: function(options){
    if (!this.inProgress() || options.source != this.get("gameState").turnPlayer.get("id")){
      return;
    }
    this.emitGameMessageToAllExcept([options.source], {
      message: "endTransaction"
    });
  },

  fill: function(options){
    if (!this.inProgress() || options.source != this.get("gameState").turnPlayer.get("id")){
      return;
    }
    this.emitGameMessageToAllExcept([options.source], {
      message: "fill",
      position: options.position,
      tool: options.tool
    });
  },

  undo: function(options){
    if (!this.inProgress() || options.source != this.get("gameState").turnPlayer.get("id")){
      return;
    }
    this.emitGameMessageToAllExcept([options.source], {
      message: "undo"
    });
  },

  clear: function(options){
    if (!this.inProgress() || options.source != this.get("gameState").turnPlayer.get("id")){
      return;
    }
    this.emitGameMessageToAllExcept([options.source], {
      message: "clear"
    });
  },

  playerLeave: function(socket){
    var gameState = this.get("gameState");
    if (gameState.turnPlayer && gameState.turnPlayer.get("id") == socket.id){
      this.endTurn(true);
    }
    if (this.get("players").length < 4){
      this.endTurn(true);
    }
    Room.prototype.playerLeave.call(this, socket);
  },

  gameStateJson: function(gameState, socketId){
    var json = {};
    if (gameState){
      json.points = gameState.points;
      json.turnPlayer = gameState.turnPlayer ? gameState.turnPlayer.get("id") : null;
      json.word = socketId == json.turnPlayer ? gameState.word : this.obscureWord(gameState.word);
    }
    return json;
  },

  randomIndex: function(max){
    return Math.floor(Math.random() * max);
  },
});

module.exports = PictionaryRoom;
