var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");

var ExplodingKittensCard = Marionette.View.extend({
	initialize: function(options){
		this.card = options.card;
		this.$el[0].card = this.card;
	},

	fullImagePath: function(){
		return this.card ? "/static/images/assets/explodingKittens/" + this.card.image + ".png" : "";
	},

	getTemplate: function(){
		return _.template(fs.readFileSync("./app/templates/partials/explodingKittens/card.html", "utf8"), this.templateContext());
	},

	templateContext: function(){
		return {
			image: this.fullImagePath()
		};
	},

	className: "EKCard",

	events: {
		"mouseover @ui.hand": "showPreview",
		"mouseout @ui.hand": "hidePreview",
		"mousedown @ui.hand": "hidePreview",
	},

	ui: {
		"hand": ".hand",
	},

	showPreview: function(evt){
		if(!this.$el.parent().hasClass("heldCards")){
			return;
		}
		var preview = $(".preview");
		preview.attr("src", this.fullImagePath());
		var hand = this.$el.find(this.ui.hand);
		preview.show();
		preview.css("left", (hand.offset().left - Math.round((preview.width() - hand.width()) / 2) - preview.parent().offset().left) + "px");
		preview.css("top", (hand.offset().top - preview.height() - 20) + "px");
		if(preview.offset().left < preview.parent().offset().left){
			preview.css("left", "10px");
		}
	},

	hidePreview: function(){
		var preview = $(".preview");
		preview.hide();
	}
});

module.exports = ExplodingKittensCard;