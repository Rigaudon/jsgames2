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
  },

  onRender: function(){
    this.setThemeIcon();
    this.setVolumeIcon();
    $(this.ui.sound).popover({
      html: true,
      container: "body",
      content: this.soundControlContent()
    });
    $(this.ui.theme).popover({
      html: true,
      container: "body",
      content: this.themeContent()
    });

    //Fixes multiple click after hide
    $("body").off("hidden.bs.popover").on("hidden.bs.popover", function (e) {
      $(e.target).data("bs.popover").inState.click = false;
    });
  },

  collapseSideBar: function(){
    this.$(this.regions.sideBarItems)
      .toggleClass("open")
      .toggleClass("closed");

    this.$(this.ui.collapse).find("span")
      .toggleClass("glyphicon-chevron-right")
      .toggleClass("glyphicon-chevron-left");

    $(".popover").popover("hide");
  },

  pickColor: function(){
    var newColor = $(this.ui.colorPicker).val();
    if (newColor != this.model.get("color")){
      this.model.pickColor(newColor);
    }
  },

  soundControlContent: function(){
    var currentVolume = (window.soundsVolume || 1) * 100;
    var rangeEl = $("<input type='range' min='0' max='100' class='volumeVal' />");
    rangeEl.val(currentVolume);
    var self = this;
    rangeEl.on("change", function(){
      self.changeVolume(rangeEl.val());
    });
    return rangeEl;
  },

  changeVolume: function(val){
    common.setVolume(val / 100);
    this.setVolumeIcon();
  },

  setVolumeIcon: function(){
    if (!window.soundsEnabled || window.soundsVolume == 0){
      $(this.ui.sound)
        .removeClass("glyphicon-volume-down")
        .removeClass("glyphicon-volume-up")
        .addClass("glyphicon-volume-off");
    } else if (window.soundsVolume <= 0.5){
      $(this.ui.sound)
        .removeClass("glyphicon-volume-up")
        .removeClass("glyphicon-volume-off")
        .addClass("glyphicon-volume-down");
    } else {
      $(this.ui.sound)
        .removeClass("glyphicon-volume-down")
        .removeClass("glyphicon-volume-off")
        .addClass("glyphicon-volume-up");
    }
  },

  themeContent: function(){
    var content = $("<div>");
    content.addClass("list");
    var self = this;
    _.forEach(common.validThemes, function(theme){
      var themeEl = $("<img>");
      themeEl.addClass("theme");
      themeEl.attr("src", "/static/images/themes/" + theme + "/icon.png");
      content.append(themeEl);
      themeEl.on("click", function(){
        common.setTheme(theme);
        self.setThemeIcon();
      });
    });
    return content;
  },

  setThemeIcon: function(){
    $(this.ui.theme).css("background-image", "url(/static/images/themes/" + common.getTheme() + "/icon.png)");
  }
});

module.exports = SideBarView;
