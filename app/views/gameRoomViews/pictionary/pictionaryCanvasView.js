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
    $(this.ui.canvas).clearCanvas();
    var overlay = $(this.ui.overlay);
    overlay.clearCanvas();
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
  /*
  redrawCanvas: function(transactions){
    transactions.forEach(function(transaction){

    });
  },

  fill: function([x, y]){

  },
*/
  drawTick: function([x, y, toolOptions]){
    $(this.ui.canvas).drawLine(_.assign({
      strokeStyle: toolOptions.type == "eraser" ? "#ffffff" : toolOptions.options.color,
      strokeWidth: toolOptions.options.size,
      rounded: true,
      x2: x, y2: y
    }, this.model.getPreviousTick(x, y)));
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
          fromCenter: false,
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
          fromCenter: false,
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
    var overlay = $(this.ui.overlay);
    if (this.previousToolPreview){
      overlay.clearCanvas({
        x: this.previousToolPreview.x,
        y: this.previousToolPreview.y,
        width: this.previousToolPreview.width || this.previousToolPreview.radius * 2 || this.previousToolPreview.fontSize + 2,
        height: this.previousToolPreview.height || this.previousToolPreview.radius * 2 || this.previousToolPreview.fontSize + 2,
        fromCenter: this.previousToolPreview.fromCenter
      });
    } else {
      overlay.clearCanvas();
    }
  },
});

module.exports = PictionaryCanvasView;
