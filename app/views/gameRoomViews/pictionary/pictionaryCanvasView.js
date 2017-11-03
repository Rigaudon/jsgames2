var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");

var PictionaryCanvasView = Marionette.View.extend({
  className: "drawboard",
  width: 800,
  height: 600,
  previousToolPreview: undefined,
  toolSize: 25,

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/pictionary/canvas.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      width: this.width,
      height: this.height
    };
  },

  ui: {
    "canvas": "#pictionaryCanvas",
    "overlay": "#pictionaryOverlay"
  },

  modelEvents: {
    "show:tool": "drawToolPreview",
    "draw:tick": "drawTick",
    "canvas:clear": "clearCanvas",
    "canvas:redraw": "redrawCanvas",
    "canvas:fill": "fill"
  },

  onRender: function(){
    this.setupCanvas();
  },

  setupCanvas: function(){
    var self = this;
    this.clearCanvas();
    this.clearOverlay();
    var overlay = $(this.ui.overlay);
    overlay.on("mousemove", function(e){
      self.model.canvasHover([e.offsetX, e.offsetY]);
    });
    overlay.on("mousedown", function(){
      self.model.startDrawing();
    });
    overlay.on("mouseout mouseup", function(){
      self.model.stopDrawing();
    });
    overlay.on("click", function(e){
      self.model.canvasClick([e.offsetX, e.offsetY]);
    });
  },

  clearCanvas: function(){
    $(this.ui.canvas).clearCanvas();
  },

  clearOverlay: function(options = {}){
    $(this.ui.overlay).clearCanvas(options);
  },

  redrawCanvas: function(transactions){
    var self = this;
    this.clearCanvas();
    transactions.forEach(function(transaction){
      self.drawTransaction(transaction);
    });
  },

  fill: function([x, y]){
    console.log("IMPLEMENT ME - fill " + x + ", " + y);
  },

  drawTransaction: function(transaction){
    var currentPosition;
    var prevPosition;
    if (transaction.tool.type == "brush" || transaction.tool.type == "eraser"){
      for (var i = 0; i < transaction.positions.length; i++){
        if (currentPosition){
          prevPosition = {
            x1: currentPosition[0],
            y1: currentPosition[1]
          };
        }
        currentPosition = transaction.positions[i];
        this.drawTick([currentPosition[0], currentPosition[1], transaction.tool, prevPosition])
      }
    } else if (transaction.tool.type == "fill"){
      this.fill(transaction.position);
    }
  },

  drawTick: function([x, y, toolOptions, previousTick]){
    $(this.ui.canvas).drawLine(_.assign({
      strokeStyle: toolOptions.type == "eraser" ? "#ffffff" : toolOptions.options.color,
      strokeWidth: toolOptions.options.size,
      rounded: true,
      x2: x, y2: y
    }, previousTick || this.model.getPreviousTick() || { x1: x, y1: y }));
  },

  getToolPreview: function(options){
    var tool = options.tool;
    switch (tool.type){
    case "eraser":
      return {
        type: "glyph",
        options: {
          text: String.fromCharCode("0xe551"),
          x: options.x,
          y: options.y,
          fontSize: this.toolSize,
          fromCenter: true,
          fontFamily: "Glyphicons Regular",
          fillStyle: "#000"
        }
      };
    case "fill":
      return {
        type: "glyph",
        options: {
          text: String.fromCharCode("0xe481"),
          x: options.x,
          y: options.y,
          fontSize: this.toolSize,
          fromCenter: true,
          fontFamily: "Glyphicons Regular",
          fillStyle: "#000"
        }
      };
    case "brush":
      return {
        type: "arc",
        options: {
          x: options.x,
          y: options.y,
          fromCenter: true,
          radius: Math.ceil(tool.options.size / 2),
          fillStyle: tool.options.color,
        }
      };
    }
  },

  drawToolPreview: function(options){
    var overlay = $(this.ui.overlay);
    this.clearToolPreview();
    var preview = this.getToolPreview(options);
    if (preview.type == "glyph"){
      overlay.drawText(preview.options);
    } else if (preview.type == "arc"){
      overlay.drawArc(preview.options);
    }
    this.previousToolPreview = preview.options;
  },

  clearToolPreview: function(){
    if (this.previousToolPreview){
      this.clearOverlay({
        x: this.previousToolPreview.x,
        y: this.previousToolPreview.y,
        width: this.previousToolPreview.width || this.previousToolPreview.radius * 2 || this.previousToolPreview.fontSize + 4,
        height: this.previousToolPreview.height || this.previousToolPreview.radius * 2 || this.previousToolPreview.fontSize + 4,
        fromCenter: this.previousToolPreview.fromCenter
      });
    } else {
      this.clearOverlay();
    }
  },
});

module.exports = PictionaryCanvasView;
