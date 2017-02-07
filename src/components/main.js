import { h, Component } from "preact";

import Dimensions from "./results/dimensions";
import SlideDeck from "./slidedeck/index";
import Default from "./default"
let components = {
  Dimensions,
  SlideDeck,
  Default
}

export default class Main extends Component {
  constructor(){
    super();

    let com = this;
    let state = {};

    this.state = state;
    this.state.setState = function(newState){
      com.setState(newState);
    }
    this.state.fetch = this.fetch.bind(this);

    return this;
  }

  componentWillMount(){
    let com = this;
    Object.keys(this.props).forEach((key)=>{
      com.state[key] = com.props[key];
    })
    com.state.assessment = {};
    this.setState(this.state, ()=>{
        com.fetch();
    })
  }

  fetch (){
    let com = this;
    Traitify.get(`/assessments/${com.state.assessmentId}?data=slides,types`).then((data)=>{
      com.state.assessment = data;
      com.setState(com.state);
    })
  }

  render() {
    var language = "en"
    var translations = {
      en: {
        potential_benefits: "Potential Benefits",
        potential_pitfalls: "Potential Pitfalls",
        show_less: "Show Less",
        show_more: "Show More"
      }
    }

    var component = components[this.props.componentName || "Default"];
    var props = this.state;
    props.translate = (key) => translations[language][key];

    return h(component, props);
  }
}
