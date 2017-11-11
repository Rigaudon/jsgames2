var Backbone = require("backbone");
var util = require("../socketUtil");
var moment = require("moment-timezone");

var nextMsgId = 0;
var ChatController = Backbone.Collection.extend({
  processMessage: function(socket, message, player, rooms){
    var chatTime = new Date();
    if (util.validateMessage(message, socket, this.io)){
      var origMessage = {
        type: "player",
        id: ++nextMsgId,
        message: message.message,
        name: player.get("name"),
        time: chatTime,
        color: player.get("color")
      };

      console.log(`${moment(chatTime).format("[[]MM-DD-YY|h:mm:ss A[]]")} ${player.get("name")}: ${message.message}`);
      if (this.io.sockets.adapter.sids[socket.id]["global"]){
        this.io.sockets.in(message.channel).emit("chatMessage", origMessage);
      } else {
        //delegate message to room controller
        rooms.processMessage(socket, message.channel, origMessage);
      }
    }
  }
});

module.exports = ChatController;
