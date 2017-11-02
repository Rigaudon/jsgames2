var Marionette = require("backbone.marionette");
var PictionaryClient = require("../../models/pictionaryClient");
var _ = require("lodash");
var fs = require("fs");

var PictionaryRoomView = Marionette.View.extend({
  initialize: function(options){
    this.player = options.player;
    this.model = new PictionaryClient({ player: options.player });
    this.player.gameClient = this.model;
  },

  ui: {
    "leaveBtn": ".leaveBtn",
    "startBtn": ".startBtn",
  },

  events: {
    "click @ui.leaveBtn": "leaveRoom",
    "click @ui.startBtn": "startRoom",
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/gameRooms/pictionary.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      controls: this.getOptions(),
    };
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
