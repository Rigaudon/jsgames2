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
    "player:turn": "setActive",
    "made:guess": "onMadeGuess",
    "end:game": "setActive"
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

  onMadeGuess: function(message){
    if (message.points){
      this.render();
    }
  }

});

module.exports = PictionaryScoreboardView;
