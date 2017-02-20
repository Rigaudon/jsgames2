var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var WelcomeView = require("./welcomeView");

var RootView = Marionette.View.extend({
	el: "body",
	template: _.template(fs.readFileSync("./app/templates/rootView.html", "utf8")),

	modelEvents: {
		"change:pid" : "onPidChange"
	},

	regions: {
		welcomeRegion: ".welcome"
	},

	onPidChange: function(){
		//new player
		//this.showChildView("welcomeRegion", new WelcomeView());
		console.log("Showing name picker");
	}
});

module.exports = RootView;