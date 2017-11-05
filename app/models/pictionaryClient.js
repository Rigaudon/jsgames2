var GameClient = require("./gameClient");
var _ = require("lodash");
var validTools = ["brush", "fill", "eraser"];

//Tools that draw by dragging
var dragTools = ["brush", "eraser"];

var PictionaryClient = GameClient.extend({
  actions: {
    playerTurn: function(message){
      this.transactions = [];
      this.currentTransaction = undefined;
      this.successfulGuess = false;
      this.get("gameState").turnPlayer = message.player;
      this.trigger("player:turn", message);
    },
    madeGuess: function(message){
      if (message.correct){
        if (this.isMe(message.player)){
          this.successfulGuess = true;
        }
        this.get("gameState").points[message.player] += message.points;
        this.get("gameState").points[this.get("gameState").turnPlayer] += message.drawerPoints;
      }
      this.trigger("made:guess", message);
    },
    endTurn: function(message){
      this.trigger("end:turn", message);
    },
    endGame: function(message){
      this.get("gameState").turnPlayer = undefined;
      this.trigger("end:game", message);
    }
  },

  isMyTurn: function(){
    return this.get("gameState") && this.isMe(this.get("gameState").turnPlayer);
  },

  canSendGuess: function(){
    return !this.isMyTurn() && !this.successfulGuess && this.inProgress();
  },

  isDrawing: false,

  selectedTool: {
    type: "brush",
    options: {
      color: "#000000",
      size: 10
    }
  },

  savedTools: {},

  transactions: [],
  currentTransaction: undefined,

  changeTool: function(tool){
    if (validTools.indexOf(tool) > -1){
      this.selectedTool.type = tool;
      this.trigger("change:selectedTool");
    }
  },

  changeToolColor: function(color){
    if (this.selectedTool.options.color){
      this.selectedTool.options.color = color;
    }
  },

  changeToolSize: function(size){
    if (this.selectedTool.options.size){
      this.selectedTool.options.size = size;
    }
  },

  canvasHover: function([x, y]){
    //if is my turn,
    this.trigger("show:tool", {
      tool: this.selectedTool,
      x: x,
      y: y
    });

    if (this.isDrawing && (this.selectedTool.type == "brush" || this.selectedTool.type == "eraser")){
      this.trigger("draw:tick", [x, y, this.selectedTool]);
      this.currentTransaction.positions.push([x, y]);
    }
  },

  canvasClick: function([x, y]){
    if (this.selectedTool.type == "fill"){
      this.transactions.push({
        tool: _.cloneDeep(this.selectedTool),
        position: [x, y]
      });
      this.trigger("canvas:fill", this.lastTransaction());
    }
  },

  lastTransaction: function(){
    if (!this.transactions.length){
      return null;
    }
    return this.transactions[this.transactions.length - 1];
  },

  clearCanvas: function(){
    if (!this.transactions.length || this.lastTransaction().tool.type == "clear"){
      return;
    }
    this.transactions.push({
      tool: {
        type: "clear"
      }
    });
    this.trigger("canvas:clear");
  },

  undo: function(){
    if (!this.transactions.length){
      return;
    }
    this.transactions.pop();
    // We only need to redraw from the last "clear"
    var lastClear = 0;
    this.transactions.forEach(function(transaction, i){
      if (transaction.tool.type == "clear"){
        lastClear = i;
      }
    });
    this.trigger("canvas:redraw", this.transactions.slice(lastClear));
  },

  startDrawing: function(){
    if (dragTools.indexOf(this.selectedTool.type) == -1){
      return;
    }
    this.isDrawing = true;
    this.currentTransaction = {
      tool: _.cloneDeep(this.selectedTool),
      positions: []
    };
  },

  stopDrawing: function(){
    if (dragTools.indexOf(this.selectedTool.type) == -1){
      return;
    }
    this.isDrawing = false;
    if (this.currentTransaction && this.currentTransaction.positions.length){
      this.transactions.push(this.currentTransaction);
    }
    this.currentTransaction = undefined;
  },

  getPreviousTick: function(){
    if (!this.currentTransaction || !this.currentTransaction.positions.length){
      return null;
    }
    var previousPosition = this.currentTransaction.positions[this.currentTransaction.positions.length - 1];
    return {
      x1: previousPosition[0],
      y1: previousPosition[1],
    };
  },

  currentPlayer: function(){
    return this.get("gameState") ? this.get("gameState").turnPlayer : null;
  },

  getPlayerInfo: function(){
    var playerInfo = [];
    if (!this.get("players")){
      return playerInfo;
    }
    var self = this;
    this.get("players").forEach(function(player){
      var info = {
        id: player.id,
        name: player.name,
        color: player.color,
        score: self.get("gameState") ? (self.get("gameState").points ? self.get("gameState").points[player.id] || 0 : 0) : 0
      };
      playerInfo.push(info);
    });

    return playerInfo.sort(function(a, b){
      return b.score - a.score;
    });
  },

  processRoomInfo: function(roomInfo){
    GameClient.prototype.processRoomInfo.call(this, roomInfo);
    this.trigger("update:room");
  },

  sendGuess: function(guess){
    if (this.canSendGuess()){
      this.socket.emit("gameMessage", {
        "command": "makeGuess",
        "guess": guess,
        "roomId": this.get("id"),
      });
    }
  }

});

module.exports = PictionaryClient;
