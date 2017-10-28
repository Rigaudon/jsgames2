var Promise = require("bluebird");
var Cookie = require("js-cookie");

//Get the transition string for finish animation
var sUsrAg = navigator.userAgent;
var finishTransition;

if (sUsrAg.indexOf("Edge") > -1){
  // "Edge";
  finishTransition = "transitionend";
  alert("Microsoft Browser detected. Please consider switching to Chrome or Firefox for best performance.");
} else if (sUsrAg.indexOf("Chrome") > -1) {
  // "Chrome";
  finishTransition = "transitionend";
} else if (sUsrAg.indexOf("Safari") > -1) {
  // "Safari";
  finishTransition = "transitionend";
} else if (sUsrAg.indexOf("Opera") > -1) {
  // "Opera";
  finishTransition = "transitionend oTransitionEnd";
} else if (sUsrAg.indexOf("Firefox") > -1) {
  // "Firefox";
  finishTransition = "transitionend webkitTransitionEnd";
} else if (sUsrAg.indexOf("MSIE") > -1) {
  // "MSIE";
  finishTransition = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
  alert("Microsoft Browser detected. Please consider switching to Chrome for best performance.");
}

function fadeOutThenIn(view, callback){
  view.bind(finishTransition, function(event){
    var target = view.parent().find(event.target);
    if (target.is(view)){
      view.unbind(finishTransition);
      callback();
      view.css("opacity", 1);
    }
  });
  view.css("opacity", 0);
}

var validThemes = ["light", "dark"];
function loadCss(theme){
  return new Promise(function(resolve){
    if (theme && validThemes.indexOf(theme) > -1){
      setTheme(theme);
    } else {
      var savedTheme = Cookie.get("theme");
      if (savedTheme && validThemes.indexOf(savedTheme) > -1){
        setTheme(savedTheme);
      } else {
        setTheme("light");
      }
    }
    resolve();
  });
}

function setTheme(theme){
  var themeCss = document.getElementById("themeCss");
  themeCss.setAttribute("href", "dist/theme-" + theme + ".css");
  Cookie.set("theme", theme);
}

function getTheme(){
  var savedTheme = Cookie.get("theme");
  if (savedTheme && validThemes.indexOf(savedTheme) > -1){
    return savedTheme;
  }
  return "light";
}
var currentTheme = getTheme();

function cycleTheme(){
  var nextTheme = (validThemes.indexOf(currentTheme) + 1) % validThemes.length;
  setTheme(validThemes[nextTheme]);
  currentTheme = validThemes[nextTheme];
  return validThemes[nextTheme];
}

module.exports = {
  finishTransition: finishTransition,
  fadeOutThenIn: fadeOutThenIn,
  loadCss: loadCss,
  getTheme: getTheme,
  cycleTheme: cycleTheme
};
