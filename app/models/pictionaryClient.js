var GameClient = require("./gameClient");
var _ = require("lodash");
var validTools = ["brush", "fill", "eraser"];
var toolDefaults = {
  "brush": {
    type: "brush",
    options: {
      color: "#000000",
      size: 4
    }
  },
  "fill": {
    type: "fill",
    options: {
      color: "#000000",
    }
  },
  "eraser": {
    type: "eraser",
    options: {
      size: 4
    }
  }
};

var PictionaryClient = GameClient.extend({
  isDrawing: false,

  selectedTool: toolDefaults.brush,

  savedTools: {},

  transactions: [],
  currentTransaction: undefined,

  changeTool: function(tool){
    if (validTools.indexOf(tool) > -1){
      this.savedTools[this.selectedTool.type] = this.selectedTool;
      if (this.savedTools[tool]){
        this.selectedTool = this.savedTools[tool];
      } else {
        this.selectedTool = toolDefaults[tool];
      }
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
      this.trigger("canvas:fill", [x, y]);
    }
  },

  lastTransaction: function(){
    if (!this.transactions.length){
      return null;
    }
    return this.transactions[this.transactions.length - 1];
  },

  clearCanvas: function(){
    if (!this.transactions.length || this.lastTransaction().tool == "clear"){
      return;
    }
    this.transactions.push({
      tool: "clear"
    });
    this.trigger("canvas:clear");
  },

  undo: function(){
    if (!this.transactions.length){
      return;
    }
    var lastClear = 0;
    this.transactions.forEach(function(transaction, i){
      if (transaction.tool == "clear"){
        lastClear = i;
      }
    });
    this.trigger("canvas:redraw", this.transactions.slice(lastClear, -1));
  },

  startDrawing: function(){
    this.isDrawing = true;
    this.currentTransaction = {
      tool: _.cloneDeep(this.selectedTool),
      positions: []
    };
  },

  stopDrawing: function(){
    this.isDrawing = false;
    if (this.currentTransaction && this.currentTransaction.positions.length){
      this.transactions.push(this.currentTransaction);
    }
    this.currentTransaction = undefined;
  },

  getPreviousTick: function(x, y){
    if (!this.currentTransaction || !this.currentTransaction.positions.length){
      return {
        x1: x, y1: y
      };
    }
    var previousPosition = this.currentTransaction.positions[this.currentTransaction.positions.length - 1];
    return {
      x1: previousPosition[0],
      y1: previousPosition[1],
    };
  },

});

module.exports = PictionaryClient;
