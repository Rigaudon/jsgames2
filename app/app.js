"use strict"
var Marionette = require("backbone.marionette");
var RootView = require("./views/rootView");
var User = require("./models/user");

var App = Marionette.Application.extend({
	region: "body",
	
	onStart: function(){
		this.showView(new RootView({
			model: new User()
		}));
	}
});

var myApp = new App();
myApp.start();