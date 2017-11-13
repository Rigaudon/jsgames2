var Marionette = require("backbone.marionette");
var _ = require("lodash");
var fs = require("fs");

var CardsAgainstHumanityMainView = Marionette.View.extend({
  className: "cahMain",
  getTemplate: function(){
    return _.template(fs.readFileSync("./app/templates/partials/gameRooms/cah/main.html", "utf8"), this.templateContext());
  },

  templateContext: function(){
    return {
      card: this.getActiveCard(),
      submissions: this.submissions
    };
  },

  modelEvents: {
    "player:turn": "onPlayerTurn",
    "card:selected": "onCardSelected",
    "show:submissions": "onShowSubmissions",
    "submission:picked": "onSubmissionPicked",
    "player:win": "render"
  },

  ui: {
    "playerInput": ".playerInput",
    "acceptInput": ".acceptInput",
    "submission": ".activeCardSmall"
  },

  events: {
    "click @ui.playerInput": "clearInput",
    "click @ui.acceptInput": "acceptInput",
    "click @ui.submission": "pickSubmission"
  },

  selected: [],

  getActiveCard: function(){
    var activeCard = _.cloneDeep(this.model.getActiveCard());
    if (activeCard){
      if (activeCard.text.indexOf("_") > -1){
        activeCard.text = activeCard.text.replace(/[_]/g, this.generatePickInput());
      } else {
        activeCard.text += " " + this.generatePickInput();
      }
    }
    return activeCard;
  },

  onPlayerTurn: function(){
    this.selected = [];
    this.accepted = false;
    this.submissions = [];
    this.render();
  },

  emptyPlaceholder: "__________",
  generatePickInput: function(){
    return this.addInputSpan(this.emptyPlaceholder);
  },

  addInputSpan: function(text){
    return "<span class='playerInput'>" + text + "</span>"
  },

  onCardSelected: function(position){
    if (this.accepted){
      return;
    }
    var cardText = this.model.getCardText(position);
    cardText = this.trimTrailingPeriod(cardText);
    var self = this;
    var replaced = false;
    var activeCard = this.model.getActiveCard();
    var numUnselected = 0;
    $(this.ui.playerInput).each(function(i, el){
      var $el = $(el);
      if ($el.html() == self.emptyPlaceholder){
        numUnselected++;
      }
      if (replaced){
        return;
      }
      if ($el.html() == self.emptyPlaceholder || activeCard.pick == 1){
        self.model.trigger("card:detach", position);
        if ($el.html() != self.emptyPlaceholder){
          self.model.trigger("card:unselected", $el.attr("data-handPosition"));
        }
        $el.html(cardText);
        $el.attr("data-handPosition", position);
        replaced = true;
        numUnselected--;
        self.selected[i] = position;
      }
    });
    if (numUnselected == 0){
      $(this.ui.acceptInput).css("visibility", "visible");
    }
  },

  trimTrailingPeriod: function(text){
    return text.charAt(text.length - 1) === "." ? text.slice(0, text.length - 1) : text;
  },

  clearInput: function(e){
    if (this.accepted || this.model.isMyTurn()){
      return;
    }
    var $el = $(e.currentTarget);
    $el.html(this.emptyPlaceholder);
    this.model.trigger("card:unselected", $el.attr("data-handPosition"));
    $el.removeAttr("data-handPosition");
    $(this.ui.acceptInput).css("visibility", "hidden");
  },

  accepted: false,

  acceptInput: function(){
    if (!this.accepted){
      this.accepted = true;
      $(this.ui.acceptInput).css("visibility", "hidden");
      this.model.submitInput(this.selected);
    }
  },

  submissions: [],
  onShowSubmissions: function(message){
    this.submissions = this.generateFullText(message.submissions);
    this.render();
  },

  generateFullText: function(submissions){
    var activeCard = this.model.getActiveCard();
    var self = this;
    submissions.forEach(function(submission){
      submission.cards = submission.cards.map(self.trimTrailingPeriod).map(self.addInputSpan);
      if (activeCard.text.indexOf("_") == -1){
        submission.fullText = activeCard.text + " " + submission.cards[0];
      } else {
        var fullText = activeCard.text;
        submission.cards.forEach(function(card){
          fullText = fullText.replace("_", card);
        });
        submission.fullText = fullText;
      }
    });
    return submissions;
  },

  pickSubmission: function(e){
    if (!this.model.isMyTurn()){
      return;
    }
    var playerId = $(e.currentTarget).attr("data-id");
    if (playerId){
      this.model.pickSubmission(playerId);
    }
  },

  onSubmissionPicked: function(message){
    $(this.ui.submission).each(function(i, el){
      var $el = $(el);
      if ($el.attr("data-id") != message.player){
        $el.remove();
      } else {
        $el.addClass("selected");
      }
    });
  }

});

module.exports = CardsAgainstHumanityMainView;
