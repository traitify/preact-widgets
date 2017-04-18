/*global sinon,expect,StepTest*/
/*eslint-disable prefer-arrow-callback*/
function Init(){
  this.test("Slidedeck Should Initialize")
          .tag("slidedeck")
          .tag("event")
          .tag("initialize")
          .step("Setup Scratch")
          .step("Load Traitify UI with SlideDeck assessment id")
          .step("Set scratch as Target")
          .step("Render and Wait for SlideDeck to Initialize")
          .expect("SlideDeck should be Ready", function(){
            this.ok(this.scratch.innerHTML.indexOf("Not Me") != -1);
          });

  this.test("Click Me Event")
          .tag("slidedeck")
          .tag("event")
          .tag("me")
          .step("Initialize SlideDeck")
          .step("Listen for", "slidedeck.me")
          .step("Click", ".traitify--slidedeck--me")
          .expect("Slide Deck to have Clicked Me", function(){
            this.ok(this["slidedeck.me"] == true);
          });
    
  this.test("Click Not Me Event")
          .tag("slidedeck")
          .tag("event")
          .tag("not me")
          .step("Initialize SlideDeck")
          .step("Listen for", "slidedeck.notMe")
          .step("Click", ".traitify--slidedeck--notMe")
          .expect("Slide Deck to have Clicked Not Me", function(){
            this.ok(this["slidedeck.notMe"] == true);
          });

  this.test("Answer Slide Event")
          .tag("slidedeck")
          .tag("event")
          .tag("answer slide")
          .step("Initialize SlideDeck")
          .step("Listen for", "slidedeck.AnswerSlide")
          .step("Click", ".traitify--slidedeck--notMe")
          .expect("Slide Deck to have Clicked Not Me", function(){
            this.ok(this["slidedeck.AnswerSlide"] == true);
          });
}
export default Init;
/*eslint-enable prefer-arrow-callback*/