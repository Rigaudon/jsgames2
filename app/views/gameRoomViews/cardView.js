var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");

var CardView = Marionette.View.extend({
  initialize: function(options){
    this.card = options.card;
    this.$el[0].card = this.card;
  },

  fullImagePath: function(){
    return this.card ? this.partialImagePath + this.card.image + ".png" : "";
  },

  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/card.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      image: this.fullImagePath()
    };
  },

  className: "card",

  events: {
    "mouseover @ui.hand": "showPreview",
    "mouseout @ui.hand": "hidePreview",
    "mousedown @ui.hand": "hidePreview",
  },

  ui: {
    "hand": ".hand",
  },

  showPreview: function(){
    if (!this.$el.parent().hasClass("heldCards")){
      return;
    }
    var preview = $(".preview");
    preview.attr("src", this.fullImagePath());
    var hand = this.$el.find(this.ui.hand);
    preview.show();
    preview.css("left", (hand.offset().left - Math.round((preview.width() - hand.width()) / 2) - this.totalLeftOffset(preview.parent())) + "px");
    preview.css("top", (hand.offset().top - preview.height() - 20) + "px");
    if (preview.offset().left < this.totalLeftOffset(preview.parent())){
      preview.css("right", "");
      preview.css("left", "10px");
    } else if (preview.offset().left + preview.outerWidth(true) > preview.parent().outerWidth(true)){
      preview.css("right", "10px");
      preview.css("left", "");
    }
  },

  totalLeftOffset: function(el){
    return el.offset().left - parseInt(el.css("margin-left")) - parseInt(el.css("padding-left"));
  },

  hidePreview: function(){
    var preview = $(".preview");
    preview.hide();
  }
});

module.exports = CardView;
