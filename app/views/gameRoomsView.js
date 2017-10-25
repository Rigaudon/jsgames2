var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var GameRoomsTableView = require("./gameRoomsTableView");
var GameRoom = require("../models/gameRoom");
var CreateRoomView = require("./createRoomView");

var GameRoomsView = Marionette.View.extend({
  template: _.template(fs.readFileSync("./app/templates/gameRoomsView.html", "utf8")),
  className: "gameRoomsView",
  regions: {
    gameRooms: ".gameRooms",
    createRoomView: ".createRoomView",
  },

  ui: {
    createRoom: ".createRoom",
  },

  events: {
    "click @ui.createRoom": "showCreateRoomView",
  },

  onRender: function(){
    var self = this;
    this.showChildView("gameRooms", new GameRoomsTableView({ model: self.model }));
  },

  showCreateRoomView: function(){
    var self = this;
    this.showChildView("createRoomView", new CreateRoomView({ model: new GameRoom({ user: self.model }) }));
  },

});

module.exports = GameRoomsView;
