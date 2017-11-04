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
//Tools that draw by dragging
var dragTools = ["brush", "eraser"];

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

});

module.exports = PictionaryClient;
