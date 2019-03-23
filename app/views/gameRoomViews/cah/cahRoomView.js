var _ = require("lodash");
var Marionette = require("backbone.marionette");
var CardsAgainstHumanityClient = require("../../../models/cahClient");
var CardsAgainstHumanityScoreboardView = require("./cahScoreboardView");
var CardsAgainstHumanityHandView = require("./cahHandView");
var CardsAgainstHumanityMainView = require("./cahMainView");
var fs = require("fs");

var CardsAgainstHumanityRoomView = Marionette.View.extend({
  initialize: function(options){
    this.player = options.player;
    this.model = new CardsAgainstHumanityClient({ player: options.player });
    this.player.gameClient = this.model;
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/gameRooms/cah.html", "utf8"), this.templateContext());
  },

  className: "cahRoom",

  templateContext: function(){
    return {
      controls: this.getOptions()
    };
  },

  modelEvents: {
    "update:room": "onRoomUpdate",
    "set:status": "setStatus",
    "player:win": "onPlayerWin"
  },

  ui: {
    "leaveBtn": ".leaveBtn",
    "startBtn": ".startBtn",
  },

  events: {
    "click @ui.leaveBtn": "leaveRoom",
    "click @ui.startBtn": "startRoom",
  },

  regions: {
    "scoreboard": {
      el: ".scoreboard",
      replaceElement: true
    },
    "hand": {
      el: ".hand",
      replaceElement: true
    },
    "main": {
      el: ".cahMain",
      replaceElement: true
    },
    "controls": ".controls",
    "status": ".status"
  },

  onRender: function(){
    this.showChildView("scoreboard", new CardsAgainstHumanityScoreboardView({
      model: this.model
    }));
    this.showChildView("hand", new CardsAgainstHumanityHandView({
      model: this.model
    }));
    this.showChildView("main", new CardsAgainstHumanityMainView({
      model: this.model
    }));
  },

  onRoomUpdate: function(){
    this.renderOptions();
    this.setStatus(this.model.getStatusMsg());
  },

  setStatus: function(message){
    $(this.regions.status).text(message.status);
  },

  renderOptions: function(){
    $(this.regions.controls).html(this.getOptions());
  },

  onPlayerWin: function(message){
    var player = this.model.getPlayerById(message.player);
    window.showConfetti();
    window.playSound("victory");
    this.render();
    this.setStatus({
      status: (player ? player.name : "Someone") + " won!"
    });
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
    if (this.model.inProgress()) {
      if (confirm("A game is currently in progress. Are you sure you want to leave?")) {
        this.player.leaveRoom();
      }
    } else {
      this.player.leaveRoom();
    }
  },

  startRoom: function(){
    this.model.startRoom();
  },

});

module.exports = CardsAgainstHumanityRoomView;
