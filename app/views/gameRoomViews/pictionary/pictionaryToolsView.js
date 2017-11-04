var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");
var validToolOptions = {
  "brush": ["color", "size"],
  "fill": ["color"],
  "eraser": ["size"]
};

var PictionaryToolsView = Marionette.View.extend({
  className: "tools",
  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/pictionary/tools.html", "utf8"));
  },

  ui: {
    "brush": ".brush",
    "fill": ".fill",
    "eraser": ".eraser",
    "undo": ".undo",
    "clear": ".clear",
    "color": ".brushColor",
    "size": ".brushSize"
  },

  regions: {
    "colorContainer": ".colorContainer",
    "sizeContainer": ".sizeContainer"
  },

  events: {
    "click @ui.brush": "changeTool",
    "click @ui.fill": "changeTool",
    "click @ui.eraser": "changeTool",
    "click @ui.undo": "undo",
    "click @ui.clear": "clear",
    "change @ui.color": "changeColor",
    "change @ui.size": "changeSize"
  },

  modelEvents: {
    "change:selectedTool": "render"
  },

  onRender: function(){
    var tool = this.model.selectedTool;
    $(this.ui[tool.type]).addClass("active");
    if (this.toolHasOption(tool.type, "color")){
      $(this.ui.color).val(tool.options.color);
    } else {
      $(this.regions.colorContainer).css("display", "none");
    }
    if (this.toolHasOption(tool.type, "size")){
      $(this.ui.size.val(tool.options.size));
    } else {
      $(this.regions.sizeContainer).css("display", "none");
    }
  },

  toolHasOption(tool, option){
    return validToolOptions[tool].indexOf(option) > -1;
  },

  changeTool: function(e){
    this.model.changeTool($(e.currentTarget).attr("class"));
  },

  changeColor: function(){
    this.model.changeToolColor($(this.ui.color).val());
  },

  changeSize: function(){
    this.model.changeToolSize($(this.ui.size).val());
  },

  clear: function(){
    this.model.clearCanvas();
  },

  undo: function(){
    this.model.undo();
  }

});

module.exports = PictionaryToolsView;
