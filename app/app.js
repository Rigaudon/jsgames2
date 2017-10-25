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

$(document).on("keypress", function(e){
  if (e.which == 96){ //~
    var consoleView = $(".console");
    consoleView.toggleClass("show");
    if (consoleView.hasClass("show")){
      e.preventDefault();
      $(".consoleInput").focus();
    }
  }
});
