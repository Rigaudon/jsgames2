var GameClient = require("./gameClient");
var _ = require("lodash");
var validTools = ["brush", "fill", "eraser"];

//Tools that draw by dragging
var dragTools = ["brush", "eraser"];

var MAX_BUFFER_SIZE = 2;
var defaultTool = {
  type: "brush",
  options: {
    color: "#000000",
    size: 10
  }
};

var PictionaryClient = GameClient.extend({
  actions: {
    playerTurn: function(message){
      this.transactions = [];
      this.currentTransaction = undefined;
      this.currentTransactionBuffer = [];
      this.successfulGuess = false;
      this.get("gameState").turnPlayer = message.player;
      this.selectedTool = _.cloneDeep(defaultTool);
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
    },
    setTool: function(message){
      //Only occurs when not player's turn
      this.selectedTool = message.tool;
      this.currentTransaction = {
        tool: _.cloneDeep(this.selectedTool),
        positions: []
      };
    },
    partialTransaction: function(message){
      //Only occurs when not player's turn
      for (var i = 0; i < message.buffer.length; i++){
        var x = message.buffer[i][0];
        var y = message.buffer[i][1];
        this.trigger("draw:tick", [x, y, this.selectedTool]);
        this.currentTransaction.positions.push([x, y]);
      }
    },
    endTransaction: function(){
      if (this.currentTransaction && this.currentTransaction.positions.length){
        this.transactions.push(this.currentTransaction);
      }
      this.currentTransaction = undefined;
    },
    fill: function(message){
      this.transactions.push({
        tool: message.tool,
        position: message.position,
      });
      this.trigger("canvas:fill", this.lastTransaction());
    },
    undo: function(){
      this.undo();
    },
    clear: function(){
      this.clearCanvas();
    }
  },

  isMyTurn: function(){
    return this.get("gameState") && this.isMe(this.get("gameState").turnPlayer);
  },

  canSendGuess: function(){
    return !this.isMyTurn() && !this.successfulGuess && this.inProgress();
  },

  isDrawing: false,

  selectedTool: _.cloneDeep(defaultTool),

  savedTools: {},

  transactions: [],
  currentTransaction: undefined,
  currentTransactionBuffer: [],

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
      this.addPositionToBuffer([x, y]);
    }
  },

  canvasClick: function([x, y]){
    if (this.selectedTool.type == "fill"){
      var tool = _.cloneDeep(this.selectedTool)
      this.transactions.push({
        tool: tool,
        position: [x, y]
      });
      this.trigger("canvas:fill", this.lastTransaction());
      this.socket.emit("gameMessage", {
        "command": "fill",
        "position": [x, y],
        "tool": tool,
        "roomId": this.get("id")
      });
    }
  },

  emitUndo: function(){
    this.socket.emit("gameMessage", {
      "command": "undo",
      "roomId": this.get("id")
    });
  },

  emitClear: function(){
    this.socket.emit("gameMessage", {
      "command": "clear",
      "roomId": this.get("id")
    });
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

  addPositionToBuffer: function(position){
    this.currentTransactionBuffer.push(position);
    if (this.currentTransactionBuffer.length > MAX_BUFFER_SIZE){
      this.socket.emit("gameMessage", {
        "command": "partialTransaction",
        "buffer": this.currentTransactionBuffer,
        "roomId": this.get("id")
      });
      this.currentTransactionBuffer = [];
    }
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

    this.socket.emit("gameMessage", {
      "command": "setTool",
      "tool": this.currentTransaction.tool,
      "roomId": this.get("id")
    });
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
    this.socket.emit("gameMessage", {
      "command": "partialTransaction",
      "buffer": this.currentTransactionBuffer,
      "roomId": this.get("id")
    });
    this.currentTransactionBuffer = [];
    this.socket.emit("gameMessage", {
      "command": "endTransaction",
      "roomId": this.get("id")
    });
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
