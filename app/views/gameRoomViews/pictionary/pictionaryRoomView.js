var Marionette = require("backbone.marionette");
var PictionaryClient = require("../../../models/pictionaryClient");
var _ = require("lodash");
var fs = require("fs");
var PictionaryCanvasView = require("./pictionaryCanvasView");
var PictionaryToolsView = require("./pictionaryToolsView");
var PictionaryScoreboardView = require("./pictionaryScoreboardView");
var PictionaryGuessView = require("./pictionaryGuessView");
var PictionaryGameInfoView = require("./pictionaryGameInfoView");

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
    "gameInfo": {
      el: ".gameInfo",
      replaceElement: true
    },
    "controls": ".controls",
    "status": ".status",
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
    "update:room": "onUpdateRoom",
    "update:status": "updateStatus",
    "player:turn": "onPlayerTurn",
    "change:status": "onUpdateStatus",
    "end:turn": "onEndTurn",
    "end:game": "onEndGame"
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/gameRooms/pictionary.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      controls: this.getOptions(),
    };
  },

  updateStatus: function(status){
    $(this.regions.status).text(status);
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
    this.showChildView("gameInfo", new PictionaryGameInfoView({
      model: this.model
    }));
  },

  onUpdateRoom: function(){
    this.updateOptions();
  },

  onEndTurn: function(message){
    var nextPlayer = this.model.getPlayerById(message.nextPlayer);
    if (nextPlayer){
      this.updateStatus(nextPlayer.name + " is drawing next.");
    }
  },

  onEndGame: function(message){
    var self = this;
    this.updateStatus(this.toEnglishList(message.winners.map(function(winner){
      return self.model.getPlayerById(winner).name;
    }), "and") + " won!");
    window.showConfetti();
    window.playSound("victory");
    this.updateOptions();
  },

  toEnglishList(list, lastSeparator){
    if (list.length > 1){
      list[list.length - 1] = lastSeparator + " " + list[list.length - 1];
    }
    if (list.length > 2){
      return list.join(", ");
    }
    return list.join(" ");
  },

  onUpdateStatus: function(){
    if (this.model.get("status") == 0){
      this.updateStatus("Waiting for players.");
    } else if (this.model.get("status") == 1){
      this.updateStatus("Waiting for host to start.");
    }
  },

  onPlayerTurn: function(message){
    var player = this.model.getPlayerById(message.player);
    this.updateStatus(player.name + " is drawing.");
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
