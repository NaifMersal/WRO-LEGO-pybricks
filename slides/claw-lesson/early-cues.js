/* Saved slide cues for lesson stages 1–6. A cue with phases keeps the frames of
   the separate predict, observe and explain slides it replaces: each phase is one
   press. */
Object.assign(window.ClawPresentation.cues, {
  "motion": {
    "state": "motion-start",
    "early": true,
    "stage": 1,
    "status": 0,
    "console": "none",
    "stepCode": true,
    "prompt": "Follow the movement from the motor, through the gears, to both jaws.",
    "phases": [
      {
        "title": "One motor closes both jaws",
        "label": "Observe",
        "prompt": "Watch both jaws as the motor turns.",
        "stop": "complete"
      }
    ]
  },
  "reverse": {
    "state": "reverse-start",
    "early": true,
    "stage": 1,
    "status": 0,
    "console": "none",
    "stepCode": true,
    "prompt": "Predict how both jaws will move.",
    "phases": [
      {
        "title": "Both jaws reverse together",
        "label": "Observe",
        "prompt": "The gears link both jaws to the same motor.",
        "stop": "complete"
      }
    ]
  },
  "direction-lab": {
    "state": "motion-start",
    "early": true,
    "stage": 1,
    "status": 0,
    "console": "none",
    "prompt": "Choose a direction. Run it, stop the motor, then reverse.",
    "controls": "direction"
  },
  "relative-near": {
    "state": "relative-near-start",
    "early": true,
    "stage": 2,
    "status": 0,
    "console": "none",
    "stepCode": true,
    "prompt": "Predict the movement needed to reach the dotted outline.",
    "outline": true,
    "phases": [
      {
        "title": "Open by 20 degrees",
        "label": "Observe",
        "prompt": null,
        "stop": "complete"
      },
      {
        "title": "This movement reaches the outline",
        "label": "Explain",
        "state": "relative-near-end",
        "prompt": "We moved 20° toward opening from this starting position.",
        "stop": null
      }
    ]
  },
  "relative-far": {
    "state": "relative-far-start",
    "early": true,
    "stage": 2,
    "status": 0,
    "console": "none",
    "outline": true,
    "phases": [
      {
        "title": "The same movement finishes elsewhere",
        "label": "Observe",
        "stop": "complete"
      }
    ]
  },
  "relative-lab": {
    "state": "relative-far-start",
    "early": true,
    "stage": 2,
    "status": 0,
    "console": "none",
    "controls": "relative",
    "outline": true
  },
  "relative-explain": {
    "state": "relative-far-end",
    "early": true,
    "stage": 2,
    "status": 0,
    "console": "none",
    "stepCode": true,
    "prompt": "To choose how far to move, we need the starting position and the distance to the destination.",
    "outline": true
  },
  "reference-predict": {
    "state": "home-near-start",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "stepCode": true,
    "prompt": "Could the open stop be zero, so we can measure where to close from there?",
    "outline": true
  },
  "home-a": {
    "state": "home-near-start",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "foldHome": true,
    "phases": [
      {
        "title": "home() finds the open stop",
        "label": "Observe",
        "stop": "openStop"
      },
      {
        "title": "home() finishes at the zero reference",
        "label": "Observe",
        "state": "home-near-stop",
        "stop": "complete"
      }
    ]
  },
  "home-b": {
    "state": "home-far-start",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "foldHome": true,
    "phases": [
      {
        "title": "The same open stop is found",
        "label": "Observe",
        "stop": "openStop"
      },
      {
        "title": "The same open position becomes zero",
        "label": "Observe",
        "state": "home-far-stop",
        "stop": "complete"
      }
    ]
  },
  "home-positions": {
    "state": "home-far-end",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "stepCode": true,
    "panel": "<div class=\"early-pair\"><strong>0°</strong><span>Home: fully open<br>Measure closing targets from here</span></div>",
    "outline": true,
    "foldHome": true
  },
  "arbitrary": {
    "state": "arbitrary-start",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "controls": "zero",
    "phases": [
      {
        "title": "Zero can be assigned at any position",
        "label": "Observe",
        "controls": null,
        "stop": "complete"
      },
      {
        "title": "home() restores the physical reference",
        "label": "Observe",
        "state": "restore-start",
        "foldHome": true,
        "outline": true,
        "stop": "complete"
      }
    ]
  },
  "copy-home": {
    "state": "home-far-end",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "foldHome": true,
    "prompt": "Copy and use now. We will explain the internal steps after the experiment.",
    "controls": "copy",
    "outline": true
  },
  "target-compare": {
    "state": "ready-near-start",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "panel": "<table class=\"early-table\"><thead><tr><th>Start</th><th>Movement</th><th>Target</th></tr></thead><tbody><tr class=\"step\"><td>0°</td><td>+60°</td><td>60°</td></tr><tr class=\"step\"><td>30°</td><td>+30°</td><td>60°</td></tr></tbody></table>",
    "outline": true,
    "targetVisible": true,
    "outlineAngle": 60
  },
  "ready-near": {
    "state": "ready-near-start",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "outline": true,
    "targetVisible": true,
    "outlineAngle": 60,
    "phases": [
      {
        "title": "Close to 60° measured from home",
        "label": "Observe",
        "console": "all",
        "stop": "complete"
      }
    ]
  },
  "ready-far": {
    "state": "ready-far-start",
    "early": true,
    "stage": 3,
    "status": 0,
    "console": "none",
    "outline": true,
    "targetVisible": true,
    "outlineAngle": 60,
    "phases": [
      {
        "title": "The target reaches the same opening",
        "label": "Observe",
        "console": "all",
        "stop": "complete"
      }
    ]
  },
  "grip-lab": {
    "state": "short-wide-start",
    "early": true,
    "stage": 4,
    "status": 0,
    "console": "none",
    "controls": "grip",
    "outline": true,
    "outlineAngle": 60,
    "targetVisible": true
  },
  "contact-explain": {
    "state": "grip-narrow-end",
    "early": true,
    "stage": 4,
    "status": 0,
    "console": "none",
    "stepCode": true,
    "prompt": "The wide object was already touched at 70°. At the same requested 80°, the narrower object is still untouched.",
    "targetVisible": true
  },
  "eyes-closed": {
    "state": "grip-wide-start",
    "early": true,
    "stage": 5,
    "status": 0,
    "console": "none",
    "stepControls": true,
    "sceneCaption": "Your own fingers, not the claw.",
    "scene": "bottle",
    "prompt": "Imagine a bottle already between your open fingers.",
    "controls": "vote",
    "phases": [
      {
        "title": "What tells your fingers they reached it?",
        "label": "Explain",
        "sceneCaption": "The fingers meet the bottle and press.",
        "scene": "bottle-grip",
        "prompt": "We feel resistance, then maintain enough pressure to hold the bottle.",
        "controls": null,
        "stop": null
      }
    ]
  },
  "detect-blockage": {
    "state": "close-wide-start",
    "early": true,
    "stage": 5,
    "status": 0,
    "console": "none",
    "targetVisible": true,
    "phases": [
      {
        "title": "The object prevents further closing",
        "label": "Observe",
        "stop": "outcome"
      }
    ]
  },
  "stall-reveal": {
    "state": "close-wide-end",
    "early": true,
    "stage": 5,
    "status": 1,
    "console": "none",
    "stepFlags": true,
    "displayCode": "claw.stalled()",
    "focus": "stalled",
    "targetVisible": true,
    "phases": [
      {
        "label": "Explain",
        "prompt": "A stall reports blocked movement. It does not say what blocked it, or whether an object is held."
      }
    ]
  },
  "home-detection": {
    "state": "home-far-start",
    "early": true,
    "stage": 5,
    "status": 1,
    "console": "none",
    "foldHome": true,
    "phases": [
      {
        "title": "run_until_stalled opens until movement is blocked",
        "label": "Observe",
        "foldHome": null,
        "show": [
          "home-run"
        ],
        "mark": [
          "home-run"
        ],
        "stop": "stallEvent"
      },
      {
        "title": "The effort limit is chosen before the motor runs",
        "label": "Explain",
        "show": [
          "home-limit",
          "home-run"
        ],
        "mark": [
          "home-limit"
        ],
        "showTorque": true,
        "stop": null
      },
      {
        "title": "reset_angle(0) labels the reference",
        "label": "Observe",
        "show": [
          "home-limit",
          "home-run",
          "zero"
        ],
        "mark": [
          "zero"
        ],
        "stop": "zeroed"
      },
      {
        "title": "wait(200) records the settled reading",
        "label": "Explain",
        "show": [
          "home-limit",
          "home-run",
          "settle",
          "zero"
        ],
        "mark": [
          "settle"
        ],
        "stop": null
      },
      {
        "title": "Restore the gripping limit before returning",
        "label": "Explain",
        "show": [
          "home-limit",
          "home-run",
          "settle",
          "zero",
          "grip-limit"
        ],
        "mark": [
          "grip-limit"
        ],
        "stop": "complete"
      },
      {
        "title": "Each action selects its own effort limit",
        "label": "Explain",
        "mark": [
          "home-limit",
          "grip-limit"
        ],
        "annotate": {
          "home-limit": "220 mNm to reach the stop",
          "grip-limit": "180 mNm to grip"
        },
        "stop": null
      }
    ]
  },
});
