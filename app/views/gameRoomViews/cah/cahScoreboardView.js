var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");

var CardsAgainstHumanityScoreboardView = Marionette.View.extend({
  className: "scoreboard",
  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/cah/scoreboard.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      players: this.model.getPlayerInfo()
    };
  },

  modelEvents: {
    "change:players": "render",
    "update:room": "render",
    "player:win": "render"
  },

  setActive: function(){
    var self = this;
    this.$(".player").each(function(i, el){
      var $el = $(el);
      if ($el.attr("data-id") == self.model.currentPlayer()){
        $el.addClass("active");
      } else {
        $el.removeClass("active");
      }
    });
  },

  onRender: function(){
    this.setActive();
  }
});

module.exports = CardsAgainstHumanityScoreboardView;
