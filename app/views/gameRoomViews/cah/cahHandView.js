var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");

var CardsAgainstHumanityHandView = Marionette.View.extend({
  className: "hand",
  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/cah/hand.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      cards: this.model.getCards(),
      isCzar: this.model.isMyTurn()
    };
  },

  ui: {
    "card": ".card"
  },

  events: {
    "click @ui.card": "onClickCard"
  },

  modelEvents: {
    "player:turn": "render",
    "card:unselected": "onCardUnselected",
    "card:detach": "detachCard",
    "player:win": "render"
  },

  onRender: function(){
    this.selectedCards = [];
  },

  selectedCards: [],
  onClickCard: function(e){
    var cardEl = $(e.currentTarget);
    var position = cardEl.attr("data-position");
    this.model.trigger("card:selected", position);
  },

  detachCard: function(position){
    var cardEl = $(this.ui.card).filter(function(i, el){
      return $(el).attr("data-position") == position;
    })[0];
    if (cardEl){
      this.selectedCards[position] = $(cardEl).detach();
    }
  },

  onCardUnselected: function(position){
    this.$el.append(this.selectedCards[position]);
    this.selectedCards[position] = undefined;
    var sorted = this.$el.find(this.ui.card).sort(function(a, b){
      return parseInt($(a).attr("data-position")) - parseInt($(b).attr("data-position"));
    });
    this.$el.html(sorted);
  }
});

module.exports = CardsAgainstHumanityHandView;
