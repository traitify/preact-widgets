require("polyfills");
import { h, render, rerender } from "preact";
import Default from "../../src/components/default";

import simulateEvent from "simulate-event";
import "../steps/results";

/*global sinon,expect,StepTest*/

/*eslint-disable prefer-arrow-callback*/
StepTest.test("Results Should Initialize")
        .tag("results")
        .step("Setup Scratch")
        .step("Load Traitify UI with Results assessment id")
        .step("Mock Results")
        .step("Set scratch as Target")
        .step("Render and Wait for Results to Initialize")
        .expect("SlideDeck should be Ready", function(){
          expect(this.scratch.innerHTML).to.contain("traitify--personality-badge--image");
        });

/*eslint-enable prefer-arrow-callback*/