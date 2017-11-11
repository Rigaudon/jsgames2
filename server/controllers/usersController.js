var Backbone = require("backbone");
var User = require("../user");
var util = require("../socketUtil");
var moment = require("moment-timezone");

var UsersController = Backbone.Collection.extend({
  addPlayer: function(options){
    options.name = options.name.trim();
    var response = util.validateName(options.name, this);
    if (response.success){
      if (!util.validateColor(options.color)){
        options.color = util.randomColor();
      }
      this.add(new User(options));
      var ip = options.socket.request.connection.remoteAddress;
      console.log(`${moment(new Date()).format("[[]MM-DD-YY|h:mm:ss A[]]")} ${options.name} (${options.socket.id}) joined with IP ${ip}.`);
      response.color = options.color;
    }
    return response;
  },

  removePlayer: function(id){
    console.log(`${moment(new Date()).format("[[]MM-DD-YY|h:mm:ss A[]]")} ${id} disconnected.`);
    this.remove(id);
  },

  pickColor: function(id, color){
    if (util.validateColor(color)){
      this.get(id).set("color", color);
      return {
        success: true,
        color: color
      };
    }
    return {
      success: false
    };
  }
});

module.exports = UsersController;
