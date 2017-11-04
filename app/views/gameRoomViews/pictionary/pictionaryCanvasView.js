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

  fill: function(transaction){
    var [x, y] = transaction.position;
    var canvas = $(this.ui.canvas)[0];
    var ctx = canvas.getContext("2d");
    var image = ctx.getImageData(0, 0, this.width, this.height);
    var searchColor = this.getCtxPixelAt(image, x, y);
    var newColor = this.getRgbaFromHex(transaction.tool.options.color);
    if (this.sameColor(searchColor, newColor, true)){
      return;
    }

    var pxlStack = [[x, y]];
    var currX, currY;
    var recordedLeft, recordedRight;
    while (pxlStack.length){
      recordedLeft = false;
      recordedRight = false;
      [currX, currY] = pxlStack.pop();
      while (currY > 0 && this.matchStartColor(image, currX, currY - 1, searchColor)){
        //Move cursor to top
        currY--;
      }
      while (currY < this.height && this.matchStartColor(image, currX, currY, searchColor)){
        this.setCtxPixelAt(image, currX, currY, newColor);

        if (currX > 0){
          if (this.matchStartColor(image, currX - 1, currY, searchColor)){
            if (!recordedLeft){
              pxlStack.push([currX - 1, currY]);
              recordedLeft = true;
            }
          } else if (recordedLeft){
            recordedLeft = false;
          }
        }

        if (currX < this.width){
          if (this.matchStartColor(image, currX + 1, currY, searchColor)){
            if (!recordedRight){
              pxlStack.push([currX + 1, currY]);
              recordedRight = true;
            }
          } else if (recordedRight){
            recordedRight = false;
          }
        }
        currY++;
      }
    }
    ctx.putImageData(image, 0, 0);
  },

  getRgbaFromHex: function(hex){
    hex = hex.replace("#", "");
    return [hex.substr(0, 2), hex.substr(2, 2), hex.substr(4, 2), hex.substr(6, 2) || "FF"].map(function(val){
      return parseInt(val, 16);
    });
  },

  getCtxPixelAt: function(image, x, y){
    if (x > this.width || y > this.height || x < 0 || y < 0){
      return null;
    }
    var i = 4 * (y * this.width + x);
    return image.data.slice(i, i + 4);
  },

  setCtxPixelAt: function(image, x, y, newColor){
    var i = 4 * (y * this.width + x);
    image.data[i] = newColor[0];
    image.data[i + 1] = newColor[1];
    image.data[i + 2] = newColor[2];
    image.data[i + 3] = 255; //Alpha
  },

  sameColor: function(col1, col2, matchAlpha = false){
    return col1 && col2 && col1[0] == col2[0] && col1[1] == col2[1] && col1[2] == col2[2] && (col1[3] == col2[3] || !matchAlpha);
  },

  // This is a combination of calling sameColor(startColor, getCtxPixelAt(image, x, y))
  // But flattened so that it doesnt make so twice as many function calls
  matchStartColor: function(image, x, y, startColor){
    var i = 4 * (y * this.width + x);
    return image.data[i] == startColor[0] &&
            image.data[i + 1] == startColor[1] &&
            image.data[i + 2] == startColor[2] &&
            (startColor[3] === undefined || image.data[i + 3] == startColor[3]);
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
      this.fill(transaction);
    }
  },

  drawTick: function([x, y, toolOptions, previousTick]){
    $(this.ui.canvas).drawLine(_.assign({
      strokeStyle: toolOptions.options.color,
      strokeWidth: toolOptions.options.size,
      rounded: true,
      compositing: toolOptions.type == "eraser" ? "destination-out" : "source-over",
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
