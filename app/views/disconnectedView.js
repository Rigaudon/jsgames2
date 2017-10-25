var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");

var DisconnectedView = Marionette.View.extend({
  className: "disconnected",
  template: _.template(fs.readFileSync("./app/templates/disconnected.html", "utf8")),
});

module.exports = DisconnectedView;
