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

module.exports = {
  finishTransition: finishTransition,
  fadeOutThenIn: fadeOutThenIn,
};
