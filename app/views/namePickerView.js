var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");
var Cookie = require("js-cookie");

var NamePickerView = Marionette.View.extend({
  className: "namePicker",
  template: _.template(fs.readFileSync("./app/templates/namePickerView.html", "utf8")),

  modelEvents: {
    "change:name": "nameSet",
    "change:error": "showError"
  },

  ui: {
    "nameInput": ".nameInput",
    "nameMessage": ".namePickerMsg"
  },

  events: {
    "keypress @ui.nameInput": "onNameInput",
  },

  onRender: function(){
    var storedUsername = Cookie.get("username");
    if (storedUsername && /[a-zA-Z0-9-_ ]*/.test(storedUsername)){
      $(this.ui.nameInput).val(storedUsername);
    }
  },

  onNameInput: function(e){
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == "13"){
      //Enter
      this.requestName($(e.target).val().trim());
    } else {
      //Only allow alphanumic and spaces
      return keycode == "8" || /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(keycode));
    }
  },

  requestName: function(name){
    this.model.requestName(name);
  },

  nameSet: function(){
    window.playSound("startup");
    var self = this;
    this.$el.css("opacity", 0);
    this.$el.html(`Welcome, ${this.model.get("name")}!`);
    self.$el.bind(common.finishTransition, function(){
      if (self.$el.css("opacity") == 0){
        self.remove();
        self.model.set("ready", true);
      }
    });
  },

  showError: function(){
    this.$(this.ui.nameMessage)
      .removeClass("alert-info")
      .addClass("alert-warning")
      .css("display", "block")
      .text(this.model.get("error"))
      .css("opacity", 1);
  }
});

module.exports = NamePickerView;
