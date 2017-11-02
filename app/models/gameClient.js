var Backbone = require("backbone");
var GameClient = Backbone.Model.extend({
  initialize: function(options){
    var self = this;
    this.player = options.player;
    this.socket = this.player.getSocket();
    this.socket.off("roomInfo");
    this.socket.on("roomInfo", function(roomInfo){
      self.processRoomInfo(roomInfo);
    });
    this.socket.off("gameMessage");
    this.socket.on("gameMessage", function(message){
      self.processGameMessage(message);
    });
    //We do this instead of the server side event because of the delay it takes to create the view
    this.getRoomInfo();
  },

  getRoomInfo: function(){
    this.socket.emit("requestRoomInfo");
  },

  processRoomInfo: function(roomInfo){
    var self = this;
    Object.keys(roomInfo).forEach(function(val){
      self.set(val, roomInfo[val]);
    });
    switch (roomInfo.event){
    case "playerJoin":
      window.playSound("playerJoin");
      break;
    case "playerLeave":
      window.playSound("playerLeave");
      break;
    }
  },

  inProgress: function(){
    return this.get("status") == 2;
  },

  isMe: function(id){
    return this.socket.id == id;
  },

  isHost: function(){
    return this.get("host") && this.isMe(this.get("host").id);
  },

  startRoom: function(){
    this.socket.emit("gameMessage", {
      command: "startGame",
      roomId: this.get("id")
    });
  },

  processGameMessage: function(message){
    this.actions[message.message].call(this, message);
  },

  getPlayerById: function(id){
    return this.get("players").filter(function(player){
      return player.id == id;
    })[0];
  },

});

module.exports = GameClient;
