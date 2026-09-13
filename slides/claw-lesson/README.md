# Claw Lab presentation

An offline interactive teaching deck for lesson stages 1–5 and 7–10, with 33
slides.

Open the built `output/slides/programming-the-claw.html`. Right Arrow or Space advances; Left Arrow goes back.
On a slide with staged reveals, those presses reveal the next piece first and
only then move to the next slide; Left Arrow takes the last piece back.
The transport shows `Reveal 2 / 4` while a slide still has pieces to show.
A press can also run the scene: one question, its answer and its explanation are
the same slide, reached in turn. R replays an animated slide, P pauses or
resumes, and N opens instructor notes. Use the Topic menu to jump between sections. Its nine entries are numbered consecutively.
The first slide explains the keys, and the final slide carries both code downloads.

## What each slide shows

A slide shows only the panels its question needs. The mechanism, contact line,
motor task, each reading, the status flags, the program panel, the console and
the interactive controls are switched per slide from its cue, so a prediction
slide with nothing running does not display an idle motor task or an empty
reading. The question about human fingers, `eyes-closed`, replaces the mechanism
with a bottle held between two fingertips instead of showing the claw.

Staged reveals come from the same cues. `stepCode`, `stepControls`, `stepTarget`
and `stepFlags` hold back that panel until the next press, and any element
carrying `class="step"` inside a slide or a cue panel waits its turn in document
order (`data-step` on an element moves it later). Cues can also force a panel on
with `add:` or off with `hide:`, listing part names: mechanism, contact, task,
angle, target, torque, stalled, done, code, heading, context, console, controls.

## Frames within a slide

A question, the run that answers it and the explanation that follows are one
slide. A cue lists them in `phases`, and each phase is one press. A phase can
re-seed the scene (`state`), run it to the next stop (`stop`), change any cue
key for the frames that follow, and take over the slide's heading (`title`) and
its phase label (`label`); `null` clears a key the previous frame had set. So
the deck still shows every frame it showed before, in the same order, with the
heading changing from the question to what was observed:

```js
'blocked': cue('default-wide-start'),          // Predict · What changes when we add an object?
phases: [
  {title:'The object stops closing before the target', label:'Observe', stop:'blocked'},
  {title:'The program is waiting for 130°', label:'Explain', state:'default-wide-blocked',
   focus:'target', stop:null}
]
```

Pressing back rewinds a phase: the slide is rebuilt from its own starting scene
and the frames still revealed are replayed instantly. Entering a slide from a
later one shows it fully revealed and already settled, so `clawDeck.go(id)` from
a later slide lands on the last frame, not the question.

## Sequence

| Lesson stage | Slides | Topic |
| --- | --- | --- |
| 1 | 1–3 | Motor, gears, linked jaws, direction |
| 2 | 4–7 | Relative movement from different starts |
| 3 | 8–16 | Reference, usable home(), zeroing, target movement |
| 4 | 17–18 | Grip-angle trials on a wide and a narrower object |
| 5 | 19–22 | Resistance, stall detection, internal home() walkthrough, effort limits |
| 7–10 | 23–32 | Waiting, building the checking loop, the three functions |

Home code is available from stage 3. Students can copy the complete function
or download `claw_starter.py`, configured with the supplied Port E motor,
clockwise direction, opening speed 300, and closing speed 200. The internal
teaching walkthrough begins in stage 5, after the experiment. `home-detection`
opens the folded function and reveals it one line at a time, in the order the
questions arise rather than in execution order: `run_until_stalled` first,
because it answers the slide's question, then the effort limit above it, then
`reset_angle(0)`, then `wait(200)` above the zeroing, then the restored gripping
limit. Each line appears just above the line it protects, which is also why the
limit and the pause are read as statements that must come first. A closing press
marks both limit lines together and names their values, so the effort limits are
taught where the function uses them rather than in a separate stage. Home
finishes fully open at the zero reference, with no additional target movement.
Closing targets are measured from that zero; stage 3 demonstrates target 60°.

Stage 4 runs its trials from one slide. The button names the trial before it
runs, so the class still predicts each result: 60° stops short of the wide
object, 80° is stopped by it near 70°, and the same 80° leaves a gap on the
narrower object. Every trial starts homed at the zero reference, and all three
stay in the table together. Contact in this model is separate from holding
force.

Stage 5 makes the same comparison across its own slides rather than in a
scripted lab: the object blocks closing on `detect-blockage`, `stall-reveal`
reads the flag and then states that a stall reports blocked movement and not a
held object, and the rigid open stop stalls inside `home-detection` with nothing
to catch. That reading is what stage 9's checking loop is built on, and stage 9
returns to what a stall leaves unknown.

Stage 6 has no slides of its own. Its two questions are answered where they
arise: the effort limits are named and compared on the last frame of
`home-detection` in stage 5, and requested against actual is the whole of stage
7, whose `blocked` slide ends on “The program is waiting for 130°” with the jaws
stopped near 70°. The torque reading is therefore shown in stage 5 only.

Stages 8 to 10 build the waiting one failure at a time, in the order the
questions arise. `async` runs `wait=False` with nothing after it: “2: Continue”
prints while the jaws are barely open, and then the program simply ends. Ending
a program releases the motors, so the jaws stop at 2° with 130° still requested.
`fixed-wait` adds the obvious repair, a wait, and someone has to choose its
length: 200 ms is a reasonable guess and the program still ends at 42°, short of
an object sitting at 70°. A longer number would be another guess, and a wait
measures time rather than the motor either way. `stall-loop` therefore replaces
it with `while not claw.stalled():`, which ends the moment the object blocks the
jaws. `done-check` runs that same loop on an empty claw, with an illustrative
actual angle of 132° for a requested target of 130°. The motor settles slightly
past the target within the example's 3° position tolerance. Nothing blocks the
jaws, so `stalled()` stays False and the loop keeps checking. Revealing
`claw.done()` lets the loop finish despite the small angle difference. Completion
depends on position and speed tolerances, so merely passing the target is not
enough. The engine's optional `settleOffset` and `positionTolerance` fields apply
only to this slide's two empty trials. They illustrate a settled reading, are
not Pybricks arguments or default settings, and do not simulate a controller.
The same slide closes on the empty result: `done()` is True with nothing
between the jaws, so returning does not confirm a catch. `truth-table`
then reads the finished condition, `release` opens from the grip the loop left
behind, and `functions` sets `home()`, `grab()` and `release()` side by side
under what ends each one.

The loop condition is built up rather than shown finished, so a `check` op
carries the checks it makes in `conds` (the default is both). The engine and the
code panel both read that list, which is why the same slide machinery can render
`while not claw.stalled():` and the finished four-line condition.

Ending a program releases the motors, as the hub does. Only a task still working
is visibly cut off: a movement that already reached its target keeps the frozen
snapshot its slide is discussing, and the requested angle stays on the readout so
the run can still be judged against it.

Reset scene restores a lab slide's saved state, including its reference.
Reset angle to 0 changes the angle reference without moving the jaws.
Pause freezes demonstration time. Stop motor in the direction lab releases the
motor drive.

The stage 4 comparison is a scripted walkthrough rather than free settings.
One button runs a fixed sequence of trials and names the next one, so the class
is led through the experiment instead of picking values. Every completed trial
stays in a results table beside the mechanism, which is what makes the
comparison visible. Start over clears the table and returns to the first
trial.

The deck uses the supplied Claw Lab model and saved scenes. It does not connect
to hardware. Geometry, object contact, and motor readings are illustrative.
Torque is a motor setting in mNm; the model does not estimate jaw force or prove
a secure physical grip. Teaching presets use open target 0 and grip target 130, with homing
and gripping torque limits of 220 and 180 mNm. Stage 8's guessed wait is 200 ms;
the 5000 ms observation wait that keeps later scenes alive is left out of the
stage 9 code excerpts.

## Editable source

`slides/programming-the-claw.qmd` contains slide order, instructor notes and the staged reveals of
the static slides; each slide's heading is the question its first frame asks.
`early-cues.js` contains stage 1–5 slide views and their phases;
`checkpoints.js` holds the stage 7–10 views and phases, including the loop
conditions each stage 9 slide checks. `early-scenes.js`
provides the saved model states and copyable starter code. `presentation.js`
controls the persistent demo and labs.
`lesson.css` retains the sample design; `early.css` styles the added controls,
the bottle scene and the staged reveals.

With Quarto installed, rebuild using `quarto render slides/programming-the-claw.qmd`. The slides and embedded code downloads work offline as a single HTML file.
Back to the course needs the course folder or hosted site. This version was
rendered with Quarto and verified in Edge.

From the course root, run `node slides/claw-lesson/verify-model.cjs`.
Browser verification covers all slides, the Topic menu and both download files.

Stages 11–12 are not included in this deck yet. `release()` is introduced at the
end of stage 10, so stage 11 begins from how far it should open rather than from
what the function is.

## Gear transmission

The motor axle carries a 12-tooth pinion. It meshes with a 12-tooth transfer
gear, which drives the 16-tooth right jaw gear. That gear drives the 16-tooth
left jaw gear. Each mesh reverses direction: positive motor rotation closes
both jaws. A 100-degree motor movement produces 75 degrees at each jaw.
The illustrated tooth counts preserve the teaching model's existing ratio;
they are not measurements of a physical LEGO build.

`engine.js` defines the shared gear geometry and rotation ratios. The view and
jaw-contact model use these ratios. Resetting the angle reference does not
rotate any gear; a blocked motor stops the complete train.
Run `node verify-gears.cjs` to check the transmission and its browser rendering.

## Course integration

The lesson lives in `slides/programming-the-claw.qmd`; these assets preserve its interactive layout.
`code/claw_gripper.py` is the completed module and `code/claw_starter.py` contains the starting home function.
After editing either, run `python tools/sync-claw-downloads.py` from the course root, then rebuild.
This refreshes the deck's embedded offline downloads from the same files.
