//@params
//card: initial card in the stack (when initialized)
//resolve: function to be called when stack finishes
var DELAY = 3000;

var EffectStack = function(card, resolve, options){
  this.stack = [{
    card: card,
    resolve: resolve
  }];
  this.setTimer = options.setTimer || function(){};
  this.delay = options.delay || DELAY;
  this._resolveTimeout = undefined;
  this.push = function(card, cardResolve){
    this.stack.push({
      card: card,
      resolve: cardResolve
    });
    clearTimeout(this._resolveTimeout);
    this.setResolveTimeout();
  }
  this.resolveStack = function(){
    clearTimeout(this._resolveTimeout);
    var topCard;
    while (this.stack.length){
      topCard = this.stack.pop();
      if (topCard.card.type == "nope"){
        this.stack.pop();
        continue;
      }
      if (topCard.resolve){
        topCard.resolve();
      }
      if (topCard.card.type == "defuse" && this.bottom().type == "explode"){
        break;
      }
    }
    if (options.onComplete){
      options.onComplete();
    }
  }
  this.top = function(){
    return this.stack[this.stack.length - 1].card;
  }
  this.bottom = function(){
    return this.stack[0].card;
  }
  this.setResolveTimeout = function(){
    this.setTimer(this.delay);
    this._resolveTimeout = setTimeout(this.resolveStack.bind(this), this.delay);
  }
  this.cancel = function(){
    clearTimeout(this._resolveTimeout);
    if (options.onComplete){
      options.onComplete();
    }
  }
  if (!(options.initialDelay === false)){
    this.setResolveTimeout();
  }
};

module.exports = EffectStack;
