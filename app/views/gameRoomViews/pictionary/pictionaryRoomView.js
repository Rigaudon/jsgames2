var Marionette = require("backbone.marionette");
var PictionaryClient = require("../../../models/pictionaryClient");
var _ = require("lodash");
var fs = require("fs");
var PictionaryCanvasView = require("./pictionaryCanvasView");
var PictionaryToolsView = require("./pictionaryToolsView");
var PictionaryScoreboardView = require("./pictionaryScoreboardView");
var PictionaryGuessView = require("./pictionaryGuessView");

var PictionaryRoomView = Marionette.View.extend({
  initialize: function(options){
    this.player = options.player;
    this.model = new PictionaryClient({ player: options.player });
    this.player.gameClient = this.model;
  },

  className: "pictionaryRoom",

  regions: {
    "scoreboard": {
      el: ".scoreboard",
      replaceElement: true
    },
    "canvas": {
      el: ".drawboard",
      replaceElement: true
    },
    "tools": {
      el: ".tools",
      replaceElement: true
    },
    "guess": {
      el: ".guess",
      replaceElement: true
    },
    "controls": ".controls"
  },

  ui: {
    "leaveBtn": ".leaveBtn",
    "startBtn": ".startBtn",
  },

  events: {
    "click @ui.leaveBtn": "leaveRoom",
    "click @ui.startBtn": "startRoom",
  },

  modelEvents: {
    "update:room": "updateOptions"
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/gameRooms/pictionary.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      controls: this.getOptions(),
    };
  },

  onRender: function(){
    this.showChildView("canvas", new PictionaryCanvasView({
      model: this.model
    }));
    this.showChildView("tools", new PictionaryToolsView({
      model: this.model
    }));
    this.showChildView("scoreboard", new PictionaryScoreboardView({
      model: this.model
    }));
    this.showChildView("guess", new PictionaryGuessView({
      model: this.model
    }));
  },

  updateOptions: function(){
    $(this.regions.controls).html(this.getOptions());
  },

  getOptions: function() {
    var options = "";
    if (this.model.isHost()){
      var players = this.model.get("players");
      if (players.length >= 3 && !this.model.inProgress()){
        options += "<button class=\"startBtn btn-big\">Start Game</button>";
      }
    }
    options += "<button class='leaveBtn btn-big'>Leave Room</button>";
    return options;
  },

  leaveRoom: function(){
    this.player.leaveRoom();
  },

  startRoom: function(){
    this.model.startRoom();
  },

});

module.exports = PictionaryRoomView;
