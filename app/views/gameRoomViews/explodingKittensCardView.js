var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");

var ExplodingKittensCard = Marionette.View.extend({
	initialize: function(options){
		this.card = options.card;
	},

	fullImagePath: function(){
		return "/static/images/assets/explodingKittens/" + this.card.image + ".png";
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
		"preview": ".preview"
	},

	showPreview: function(){
		var preview = this.$el.find(this.ui.preview);
		var hand = this.$el.find(this.ui.hand);
		preview.show();
		preview.css("left", "-" + Math.round((preview.width() - hand.width()) / 2) + "px");
		if(preview.offset().left < 0){
			preview.css("left", "10px");
		}
	},

	hidePreview: function(){
		var preview = this.$el.find(this.ui.preview);
		preview.hide();
	}
});

module.exports = ExplodingKittensCard;