var _ = require("lodash");
var Backbone = require("backbone");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var SideBarView = Marionette.View.extend({
	className: "fullWidth fullHeight",
	template: _.template(fs.readFileSync("./app/templates/sideBarView.html", "utf8")),
	regions: {
		"sideBarItems": ".sideBarItems"
	},

	ui: {
		"collapse": ".collapseSideBar"
	},

	events: {
		"click @ui.collapse": "collapseSideBar"
	},

	collapseSideBar: function(){
		this.$(this.regions.sideBarItems)
			.toggleClass("open")
			.toggleClass("closed");

		this.$(this.ui.collapse).find("span")
			.toggleClass("glyphicon-cog")
			.toggleClass("glyphicon-chevron-left");
	},
});

module.exports = SideBarView;
