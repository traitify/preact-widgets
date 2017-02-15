import { h, Component } from "preact";
import style from "./style";

import PersonalityBadge from "../personality-badge";

export default class PersonalityBlend extends Component {
  render() {
    var blend = this.props.assessment.personality_blend;
    if(!blend) { return <div />; }
    return (
      <div class={style.blend}>
        <PersonalityBadge type={blend.personality_type_1} />
        <PersonalityBadge type={blend.personality_type_2} />
        <h3 class={style.name}>{blend.name}</h3>
        <p class={style.description}>{blend.description}</p>
      </div>
    );
  }
}