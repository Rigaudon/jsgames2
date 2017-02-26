var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var DisconnectedView = Marionette.View.extend({
	className: "disconnected",
	template: _.template(fs.readFileSync("./app/templates/disconnected.html", "utf8")),
});

module.exports = DisconnectedView;
