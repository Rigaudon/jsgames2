var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");

var PictionaryScoreboardView = Marionette.View.extend({
  className: "scoreboard",
  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/pictionary/scoreboard.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      players: this.model.getPlayerInfo()
    };
  },

  modelEvents: {
    "change:players": "render",
    "player:turn": "setActive"
  },

  setActive: function(message){
    this.$(".player").each(function(i, el){
      var $el = $(el);
      if ($el.attr("data-id") == message.player){
        $el.addClass("active");
      } else {
        $el.removeClass("active");
      }
    });
  }

});

module.exports = PictionaryScoreboardView;
