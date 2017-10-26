var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var gamesCollection = new Backbone.Collection(require("../../games.json"));

var PasswordInputView = Marionette.View.extend({
  className: "modal fade passwordInput",
  attributes: {
    role: "dialog"
  },

  initialize: function(options){
    this.model = options.model;
    this.room = options.room;
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/passwordInputView.html", "utf8"));
  },

  regions: {
    "password": "input"
  },

  ui: {
    "joinBtn": ".joinBtn"
  },

  events: {
    "click @ui.joinBtn": "joinRoom"
  },

  joinRoom: function(){
    //@TODO: shake and show red when not correct
    this.model.joinRoom(this.room.id, this.$(this.regions.password).val());
  }
});

var GameRoomListItem = Marionette.View.extend({
  getTemplate: function(){
    var self = this;
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/gameRoomListItem.html", "utf8"), self.templateContext());
  },

  statusCodes: ["Waiting for players", "Waiting to start", "Playing"],

  tagName: "tr",
  templateContext: function(){
    var options = this.model.get("options");
    var gameName = gamesCollection.get(options.gameId).get("name");
    return {
      password: this.model.get("hasPassword"),
      name: options.roomName,
      game: gameName,
      players: this.model.get("players").length,
      status: this.statusCodes[this.model.get("status")],
      actions: this.getActions(),
    };
  },

  formatPlayers: function(players){
    var playersString = "";
    _.forEach(players, function(player){
      playersString += `<span style="color:${player.color}">${player.name}</span> `;
    });
    return playersString;
  },

  getActions: function(){
    //Change me later, add spectate option
    //Check if room full
    var actions = "";
    if (this.model.get("maxPlayers") > this.model.get("players").length && this.model.get("status") == 0){
      actions += "<button class='joinRoomBtn' id='joinRoom" + this.model.get("id") + "'>Join Room</button>";
    }
    //if can spectate...
    //actions += "<button class='spectateBtn'>Spectate</button>";

    return actions;
  },

});

var EmptyGameRoomListItem = Marionette.View.extend({
  template: _.template(fs.readFileSync("./app/templates/partials/gameRooms/emptyGameRoomListItem.html", "utf8")),
  tagName: "tr",
});

var RoomCollectionView = Marionette.CollectionView.extend({
  tagName: "tbody",
  className: "roomList",
  childView: GameRoomListItem,
  emptyView: EmptyGameRoomListItem,

});

var GameRoomsTableView = Marionette.View.extend({
  tagName: "table",
  className: "gameRoomsTable",
  template: _.template(fs.readFileSync("./app/templates/partials/gameRooms/gameRoomsTableView.html", "utf8")),

  modelEvents: {
    "change:activeRooms": "render"
  },

  ui: {
    "joinRoomBtn": ".joinRoomBtn"
  },

  events: {
    "click @ui.joinRoomBtn": "requestJoinRoom"
  },

  onRender: function(){
    var self = this;
    var roomColView = new RoomCollectionView({
      collection: self.model.get("activeRooms")
    });
    this.$el.append(roomColView.$el);
    roomColView.render();
  },

  requestJoinRoom: function(event){
    var btnId = event.target.id;
    var roomId = parseInt(btnId.replace("joinRoom", ""));
    var activeRoom = this.model.get("activeRooms").get(roomId);
    if (activeRoom.get("hasPassword")){
      var parentDiv = this.$el.parent().parent();
      parentDiv.find(".passwordInput").remove();
      var passInput = new PasswordInputView({ model: this.model, room: activeRoom });
      parentDiv.append(passInput.$el);
      passInput.render();
      $(passInput.$el).modal({
        backdrop: false,
        keyboard: true,
        show: true
      });
    } else {
      this.model.joinRoom(roomId, "");
    }
  }
});

module.exports = GameRoomsTableView;
