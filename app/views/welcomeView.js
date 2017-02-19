var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");

var WelcomeView = Marionette.View.extend({
	template: _.template(fs.readFileSync("./app/templates/welcomeView.html", "utf8")),
});

module.exports = WelcomeView;
