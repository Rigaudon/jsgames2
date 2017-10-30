var _ = require("lodash");
var Marionette = require("backbone.marionette");
var fs = require("fs");
var common = require("../common");

var SideBarView = Marionette.View.extend({
  className: "fullWidth fullHeight",
  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/sideBarView.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      color: this.model.get("color")
    };
  },

  regions: {
    "sideBarItems": ".sideBarItems"
  },

  ui: {
    "collapse": ".collapseSideBar",
    "colorPicker": ".colorPicker",
    "sound": ".volumeControl",
    "theme": ".selectTheme"
  },

  events: {
    "click @ui.collapse": "collapseSideBar",
    "blur @ui.colorPicker": "pickColor",
    "click @ui.sound": "toggleSound",
    "click @ui.theme": "toggleTheme"
  },

  onRender: function(){
    this.setThemeIcon();
    this.setVolumeIcon();
  },

  collapseSideBar: function(){
    this.$(this.regions.sideBarItems)
      .toggleClass("open")
      .toggleClass("closed");

    this.$(this.ui.collapse).find("span")
      .toggleClass("glyphicon-chevron-right")
      .toggleClass("glyphicon-chevron-left");
  },

  pickColor: function(){
    var newColor = $(this.ui.colorPicker).val();
    if (newColor != this.model.get("color")){
      this.model.pickColor(newColor);
    }
  },

  toggleSound: function(){
    common.toggleSound();
    this.setVolumeIcon();
  },

  setVolumeIcon: function(){
    if (!window.soundsEnabled){
      $(this.ui.sound).removeClass("glyphicon-volume-up").addClass("glyphicon-volume-off");
    } else {
      $(this.ui.sound).addClass("glyphicon-volume-up").removeClass("glyphicon-volume-off");
    }
  },

  toggleTheme: function(){
    common.cycleTheme();
    this.setThemeIcon();
  },

  setThemeIcon: function(){
    $(this.ui.theme).css("background-image", "url(/static/images/themes/" + common.getTheme() + "/icon.png)");
  }
});

module.exports = SideBarView;
