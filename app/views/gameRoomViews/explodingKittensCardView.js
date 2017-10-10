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
		"mouseover": "showPreview",
		"mouseout": "hidePreview"
	},

	showPreview: function(){
		var preview = $('.cardPreview');
		preview.attr("src", this.fullImagePath());
		preview.show();
	},

	hidePreview: function(){
		$('.cardPreview').hide();
	}
});

module.exports = ExplodingKittensCard;