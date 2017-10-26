var Card = function(card, i) {
  this.name = card.name;
  this.type = card.type;
  this.id = card.id;
  if (card.image){
    this.image = card.image;
  } else {
    if (card.variableImage){
      this.image = card.id + (i % card.num);
    } else {
      this.image = card.id;
    }
  }

  this.toJSON = function(){
    return {
      name: this.name,
      type: this.type,
      id: this.id,
      image: this.image
    }
  }
};

module.exports = Card;
