var Backbone = require("backbone");
var User = require("../user");
var util = require("../socketUtil");

var UsersController = Backbone.Collection.extend({
  addPlayer: function(options){
    options.name = options.name.trim();
    var response = util.validateName(options.name, this);
    if (response.success){
      if (!util.validateColor(options.color)){
        options.color = util.randomColor();
      }
      this.add(new User(options));
      response.color = options.color;
    }
    return response;
  },

  removePlayer: function(id){
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
