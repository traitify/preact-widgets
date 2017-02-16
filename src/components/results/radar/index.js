import { h, Component } from "preact";
import Chart from "chart-override";
import style from "./style";

export default class Radar extends Component {
  constructor(props) {
    super(props);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.tooSmall = this.tooSmall.bind(this);
    this.createChart = this.createChart.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.destroyChart = this.destroyChart.bind(this);
  }
  componentWillMount() {
    this.updateDimensions();
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }
  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
    if(this.tooSmall()) { return; }
    this.createChart();
  }
  componentDidUpdate() {
    if(this.tooSmall()) { return this.destroyChart(); }
    this.updateChart();
  }
  updateDimensions() {
    var width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;
    this.setState({ width: width });
  }
  tooSmall() {
    return this.state.width < 960;
  }
  createChart() {
    var data = {
      labels: [],
      labelImages: [],
      datasets: [{
        data: [],
        fill: false,
        borderColor: "#42b0db",
        pointBackgroundColor: "#42b0db",
        pointBorderColor: "#42b0db"
      }]
    };
    this.props.assessment.personality_types.forEach(function(type) {
      data.labels.push({
        text: type.personality_type.name,
        image: type.personality_type.badge.image_small
      });
      data.datasets[0].data.push(type.score);
    });

    var max = this.props.assessment.personality_types[0].score > 10 ? 100 : 10;
    var options = {
      legend: { display: false },
      responsive: false,
      scale: {
        ticks: {
          fontSize: 10,
          min: 0,
          max: max,
          showLabelBackdrop: false,
          stepSize: max / 2
        },
        pointLabels: { fontSize: 16 }
      },
      tooltips: { enabled: false }
    };

    var ctx = this.canvas.getContext("2d");
    this.chart = new Chart(ctx, { type: "radar", data: data, options: options });
  }
  updateChart() {
    if(!this.chart) { return this.createChart(); }
    this.chart.resize();
  }
  destroyChart() {
    if(!this.chart) { return; }
    this.chart.destroy();
    delete this.chart;
  }
  render() {
    return (
      <div class={style.radar}>
        <canvas ref={(canvas) => { this.canvas = canvas; }} width="500" height="200" />
      </div>
    );
  }
}
