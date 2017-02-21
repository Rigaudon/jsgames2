var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var GameRoomsTableView = Marionette.View.extend({
	tagName: "table",
	className: "gameRoomsTable",
	template: _.template(fs.readFileSync("./app/templates/gameRoomsTableView.html", "utf8")),
});

module.exports = GameRoomsTableView;
