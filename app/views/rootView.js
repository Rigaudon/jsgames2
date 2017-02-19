var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");

var WelcomeView = require("./welcomeView");

var RootView = Marionette.View.extend({
	el: "body",
	template: _.template(fs.readFileSync("./app/templates/rootView.html", "utf8")),

	regions: {
		welcomeRegion: ".welcome"
	},

	onRender: function(){
		this.showChildView("welcomeRegion", new WelcomeView());
	},
});

module.exports = RootView;