import Chart from "chart.js";

let imageSize = 65;
let helpers = Chart.helpers;
let globalDefaults = Chart.defaults.global;
let constructor = Chart.scaleService.getScaleConstructor("radialLinear");
helpers.isObject = function(obj) { return Object.prototype.toString.call(obj) === "[object Object]"; };

let defaultConfig = {
  display: true,
  animate: true,
  lineArc: false,
  position: "chartArea",
  angleLines: {
    display: true,
    color: "rgba(0, 0, 0, 0.1)",
    lineWidth: 1
  },
  ticks: {
    showLabelBackdrop: true,
    backdropColor: "rgba(255,255,255,0.75)",
    backdropPaddingY: 2,
    backdropPaddingX: 2,
    callback: Chart.Ticks.formatters.linear
  },
  pointLabels: {
    fontSize: 10,
    callback: (label)=>{ return label; }
  }
};

function getValueCount(scale) {
  return !scale.options.lineArc ? scale.chart.data.labels.length : 0;
}

function getPointLabelFontOptions(scale) {
  let pointLabelOptions = scale.options.pointLabels;
  let fontSize = helpers.getValueOrDefault(pointLabelOptions.fontSize, globalDefaults.defaultFontSize);
  let fontStyle = helpers.getValueOrDefault(pointLabelOptions.fontStyle, globalDefaults.defaultFontStyle);
  let fontFamily = helpers.getValueOrDefault(pointLabelOptions.fontFamily, globalDefaults.defaultFontFamily);
  let font = helpers.fontString(fontSize, fontStyle, fontFamily);

  return {
    size: fontSize,
    style: fontStyle,
    family: fontFamily,
    font
  };
}

function measureLabelSize(ctx, fontSize, label, angle) {
  if (helpers.isArray(label)) {
    return {
      w: helpers.longestText(ctx, ctx.font, label),
      h: (label.length * fontSize) + ((label.length - 1) * 1.5 * fontSize)
    };
  }
  if (helpers.isObject(label)){
    let width = ctx.measureText(label.text).width;
    let height = label.text ? fontSize * 2 : 0;
    return {
      w: width > imageSize ? width : imageSize,
      h: (angle == 0 || angle == 180) ? height + imageSize : height
    };
  }

  return {
    w: ctx.measureText(label).width,
    h: fontSize
  };
}

function determineLimits(angle, pos, size, min, max) {
  if (angle === min || angle === max) {
    return {
      start: pos - (size / 2),
      end: pos + (size / 2)
    };
  } else if (angle < min || angle > max) {
    return {
      start: pos - size - 5,
      end: pos
    };
  }

  return {
    start: pos,
    end: pos + size + 5
  };
}

function fitWithPointLabels(scale) {
  let plFont = getPointLabelFontOptions(scale);
  let largestPossibleRadius = Math.min(scale.height / 2, scale.width / 2);
  let furthestLimits = {
    l: scale.width,
    r: 0,
    t: scale.height,
    b: 0
  };
  let furthestAngles = {};
  let i;
  let labelSize;
  let pointPosition;

  scale.ctx.font = plFont.font;
  scale._pointLabelSizes = [];

  let valueCount = getValueCount(scale);
  for (i = 0; i < valueCount; i++) {
    let angleRadians = scale.getIndexAngle(i);
    let angle = helpers.toDegrees(angleRadians) % 360;

    pointPosition = scale.getPointPosition(i, largestPossibleRadius);
    labelSize = measureLabelSize(scale.ctx, plFont.size, scale.pointLabels[i] || "", angle);
    scale._pointLabelSizes[i] = labelSize;

    let hLimits = determineLimits(angle, pointPosition.x, labelSize.w, 0, 180);
    let vLimits = determineLimits(angle, pointPosition.y, labelSize.h, 90, 270);

    if (hLimits.start < furthestLimits.l) {
      furthestLimits.l = hLimits.start;
      furthestAngles.l = angleRadians;
    }

    if (hLimits.end > furthestLimits.r) {
      furthestLimits.r = hLimits.end;
      furthestAngles.r = angleRadians;
    }

    if (vLimits.start < furthestLimits.t) {
      furthestLimits.t = vLimits.start;
      furthestAngles.t = angleRadians;
    }

    if (vLimits.end > furthestLimits.b) {
      furthestLimits.b = vLimits.end;
      furthestAngles.b = angleRadians;
    }
  }

  scale.setReductions(largestPossibleRadius, furthestLimits, furthestAngles);
}

function fit(scale) {
  let largestPossibleRadius = Math.min(scale.height / 2, scale.width / 2);
  scale.drawingArea = Math.round(largestPossibleRadius);
  scale.setCenterPoint(0, 0, 0, 0);
}

function getTextAlignForAngle(angle) {
  if (angle === 0 || angle === 180) {
    return 'center';
  } else if (angle < 180) {
    return 'left';
  }

  return 'right';
}

function fillLabel(ctx, label, position, fontSize, angle) {
  let x = position.x;
  let y = position.y;

  if (helpers.isArray(label)) {
    let spacing = 1.5 * fontSize;

    for (let i = 0; i < label.length; ++i) {
      ctx.fillText(label[i], x, y);
      y += spacing;
    }
  } else if (helpers.isObject(label)) {
    if (label.image) {
      let textWidth = ctx.measureText(label.text).width;
      let img = new Image;
      let pE = ctx.canvas.parentElement;
      let i = 500 / (pE.clientHeight || pE.height);
      let width = imageSize / i;
      let height = imageSize / i;
      img.src = label.image;

      if (angle == 0) {
        ctx.drawImage(img, x - width/2, y, width, height);
        y = y + height;
      } else if (angle < 180) {
        ctx.drawImage(img, x + (textWidth - width)/2, y - height, width, height);
      } else if (angle == 180) {
        ctx.drawImage(img, x - width/2, y + fontSize, width, height);
      } else if (angle > 180) {
        ctx.drawImage(img, x - (textWidth + width)/2, y - height, width, height);
      }
    }
    if (label.text) {
      ctx.fillText(label.text, x, y);
    }
  } else {
    ctx.fillText(label, x, y);
  }
}

function adjustPointPositionForLabelHeight(angle, labelSize, position) {
  if (angle === 90 || angle === 270) {
    position.y -= (labelSize.h / 2);
  } else if (angle > 270 || angle < 90) {
    position.y -= labelSize.h;
  }
}

function drawPointLabels(scale) {
  let ctx = scale.ctx;
  let getValueOrDefault = helpers.getValueOrDefault;
  let opts = scale.options;
  let angleLineOpts = opts.angleLines;
  let pointLabelOpts = opts.pointLabels;

  ctx.lineWidth = angleLineOpts.lineWidth;
  ctx.strokeStyle = angleLineOpts.color;

  let outerDistance = scale.getDistanceFromCenterForValue(opts.reverse ? scale.min : scale.max);

  // Point Label Font
  let plFont = getPointLabelFontOptions(scale);

  ctx.textBaseline = 'top';

  for (let i = getValueCount(scale) - 1; i >= 0; i--) {
    if (angleLineOpts.display) {
      let outerPosition = scale.getPointPosition(i, outerDistance);
      ctx.beginPath();
      ctx.moveTo(scale.xCenter, scale.yCenter);
      ctx.lineTo(outerPosition.x, outerPosition.y);
      ctx.stroke();
      ctx.closePath();
    }
    // Extra 3px out for some label spacing
    let pointLabelPosition = scale.getPointPosition(i, outerDistance + 5);

    // Keep this in loop since we may support array properties here
    let pointLabelFontColor = getValueOrDefault(pointLabelOpts.fontColor, globalDefaults.defaultFontColor);
    ctx.font = plFont.font;
    ctx.fillStyle = pointLabelFontColor;

    let angleRadians = scale.getIndexAngle(i);
    let angle = helpers.toDegrees(angleRadians);
    ctx.textAlign = getTextAlignForAngle(angle);
    adjustPointPositionForLabelHeight(angle, scale._pointLabelSizes[i], pointLabelPosition);
    fillLabel(ctx, scale.pointLabels[i] || '', pointLabelPosition, plFont.size, angle);
  }
}

function drawRadiusLine(scale, gridLineOpts, radius, index) {
  let ctx = scale.ctx;
  ctx.strokeStyle = helpers.getValueAtIndexOrDefault(gridLineOpts.color, index - 1);
  ctx.lineWidth = helpers.getValueAtIndexOrDefault(gridLineOpts.lineWidth, index - 1);

  if (scale.options.lineArc) {
    // Draw circular arcs between the points
    ctx.beginPath();
    ctx.arc(scale.xCenter, scale.yCenter, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  } else {
    // Draw straight lines connecting each index
    let valueCount = getValueCount(scale);

    if (valueCount === 0) {
      return;
    }

    ctx.beginPath();
    let pointPosition = scale.getPointPosition(0, radius);
    ctx.moveTo(pointPosition.x, pointPosition.y);

    for (let i = 1; i < valueCount; i++) {
      pointPosition = scale.getPointPosition(i, radius);
      ctx.lineTo(pointPosition.x, pointPosition.y);
    }

    ctx.closePath();
    ctx.stroke();
  }
}

function numberOrZero(param) {
  return helpers.isNumber(param) ? param : 0;
}

// Updated to show 0 and allow images
let LinearRadialWithImagesScale = constructor.extend({
  fit: function(){
    if (this.options.lineArc) {
      fit(this);
    } else {
      fitWithPointLabels(this);
    }
  },
  draw: function(){
    let me = this;
    let opts = me.options;
    let gridLineOpts = opts.gridLines;
    let tickOpts = opts.ticks;
    let getValueOrDefault = helpers.getValueOrDefault;

    if (opts.display) {
      let ctx = me.ctx;

      // Tick Font
      let tickFontSize = getValueOrDefault(tickOpts.fontSize, globalDefaults.defaultFontSize);
      let tickFontStyle = getValueOrDefault(tickOpts.fontStyle, globalDefaults.defaultFontStyle);
      let tickFontFamily = getValueOrDefault(tickOpts.fontFamily, globalDefaults.defaultFontFamily);
      let tickLabelFont = helpers.fontString(tickFontSize, tickFontStyle, tickFontFamily);

      me.ticks.forEach((label, index)=>{
        let yCenterOffset = me.getDistanceFromCenterForValue(me.ticksAsNumbers[index]);
        let yHeight = me.yCenter - yCenterOffset;

        // Draw circular lines around the scale
        if (gridLineOpts.display && index !== 0) {
          drawRadiusLine(me, gridLineOpts, yCenterOffset, index);
        }

        if (tickOpts.display) {
          let tickFontColor = getValueOrDefault(tickOpts.fontColor, globalDefaults.defaultFontColor);
          ctx.font = tickLabelFont;

          if (tickOpts.showLabelBackdrop) {
            let labelWidth = ctx.measureText(label).width;
            ctx.fillStyle = tickOpts.backdropColor;
            ctx.fillRect(
              me.xCenter - labelWidth / 2 - tickOpts.backdropPaddingX,
              yHeight - tickFontSize / 2 - tickOpts.backdropPaddingY,
              labelWidth + tickOpts.backdropPaddingX * 2,
              tickFontSize + tickOpts.backdropPaddingY * 2
            );
          }

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = tickFontColor;
          ctx.fillText(label, me.xCenter, yHeight);
        }
      });

      if (!opts.lineArc) {
        drawPointLabels(me);
      }
    }
  }
});

Chart.scaleService.registerScaleType("radialLinearWithImages", LinearRadialWithImagesScale, defaultConfig);
Chart.defaults.radar.scale.type = "radialLinearWithImages";

module.exports = Chart;
