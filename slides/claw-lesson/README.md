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
reading. The `eyes-closed` cue (a bottle between two fingertips) is still defined
in `early-cues.js` but no slide uses it: the deck dropped that slide (decision #65)
because students already met stall at the wall in *Stop at the Wall*.

Staged reveals come from the same cues. `stepCode`, `stepControls`, `stepTarget`
and `stepFlags` hold back that panel until the next press, and any element
carrying `class="step"` inside a slide or a cue panel waits its turn in document
order (`data-step` on an element moves it later). Cues can also force a panel on
with `add:` or off with `hide:`, listing part names: mechanism, contact, task,
angle, target, torque, stalled, load, done, code, heading, context, console, controls.
The `abs(load())` reading appears only where a cue sets `showLoad`; the stage 9
and 10 cues that read it also hide `stalled`.

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
  {title:'The program is waiting for 72°', label:'Explain', state:'default-wide-blocked',
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
| 1 | 1–4 | Motor, 12-to-20 gearing, linked jaws, direction |
| 2 | 5–8 | Relative movement from different starts |
| 3 | 9–17 | Reference, usable home(), zeroing, target movement |
| 4 | 18–19 | Grip-angle trials on a wide and a narrower object |
| 5 | 20–22 | Resistance, stall detection (a recap of *Stop at the Wall*), internal home() walkthrough, effort limits |
| 7–10 | 23–33 | Waiting, building the checking loop, the three functions, bench challenge |

Home code is available from stage 3. Students can copy the complete function
or download `claw_starter.py`, configured with Port E, clockwise direction, and
the 12-tooth to 20-tooth gear train. The internal
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
Closing targets are output-axle degrees from that zero; stage 3 demonstrates target 45°.
The simulation draws a sweep arc around the output gear and updates its angle
from home to the current position. Before homing, it says “Home not set”; an
arbitrary zero does not claim to be the open stop.

Stage 4 runs its trials from one slide. The button names the trial before it
runs, so the class still predicts each result: 45° stops short of the wide
object, 60° is stopped by it near 52°, and the same 60° leaves a gap on the
narrower object. Every trial starts homed at the zero reference, and all three
stay in the table together. Contact in this model is separate from holding
force.

Stage 5 makes the same comparison across its own slides rather than in a
scripted lab: the object blocks closing on `detect-blockage`, `stall-reveal`
reads the flag and then states that a stall reports blocked movement and not a
held object, and the rigid open stop stalls inside `home-detection` with nothing
to catch. Stage 9's checking loop tries that reading first, then trades it for
`load()`; `home()` keeps `run_until_stalled`, because stalling at the rigid stop
is how it finds zero.

Stage 6 has no slides of its own. Its two questions are answered where they
arise: the effort limits are named and compared on the last frame of
`home-detection` in stage 5, and requested against actual is the whole of stage
7, whose `blocked` slide ends on “The program is waiting for 72°” with the jaws
stopped near 52°. The torque reading is therefore shown in stage 5 only.

Stages 8 to 10 build the waiting one failure at a time, in the order the
questions arise. `async` runs `wait=False` with nothing after it: “2: Continue”
prints while the jaws are barely open, and then the program simply ends. Ending
a program releases the motors, so the jaws stop near 2° with 72° still requested.
`fixed-wait` adds the obvious repair, a wait, and someone has to choose its
length: 200 ms is a reasonable guess and the program still ends at 25°, short of
an object reached near 52°. A longer number would be another guess, and a wait
measures time rather than the motor either way. `load-loop` therefore replaces
it with the loop students propose from stage 5, `while not claw.stalled():`. It
works, after a pause: the jaws sit on the object while the check counter keeps
climbing, because `stalled()` waits until the push has reached the full 180 mNm
limit and stayed there. The slide's second phase swaps in
`while abs(claw.load()) < 100:`, which leaves as the push passes 100 mNm on the
way up; the closing command keeps squeezing to 180 afterwards. `done-check` runs
that load-only loop on an empty claw. The close target is deliberately short of
the angle where empty jaws would meet, so the movement reaches 72° and stops with
a gap still between the jaws. Nothing pushes back, the load stays low and the
loop keeps checking. Revealing `claw.done()` lets the loop finish: a completed
movement is the only ending an unobstructed trial can produce. Real Pybricks decides completion from position and speed
tolerances; this model arrives exactly on the target and does not simulate a
controller. The same slide closes on the empty result: `done()` is True with nothing
between the jaws, so returning does not confirm a catch. `truth-table`
then reads the finished condition, `release` opens from the grip the loop left
behind, and `functions` sets `home()`, `grab()` and `release()` side by side
under what ends each one. The release function accepts `wait=True` by default;
`claw.release(wait=False)` starts opening and returns so the next drive can
overlap it. The bench challenge compares timing and object placement with both
options. Homing remains blocking. The release simulation still demonstrates
the default waiting behavior.

The loop condition is built up rather than shown finished, so a `check` op
carries the checks it makes in `conds` (the default is `LOOP_CONDS`, load and
done). The engine and the code panel both read that list, which is why the same
slide machinery can render `while not claw.stalled():`,
`while abs(claw.load()) < 100:` and the finished four-line condition.

The engine models `load()` the way the Pybricks firmware reports it: the
controller's push, capped at the torque limit, low-pass filtered every 5 ms
(`avg*0.95 + push*0.05`) and negated, so it reads negative while closing. Closing
on air it holds a small friction value; blocked, the push climbs fast and then
slowly to the limit, since a `run_target` reference that has reached its target
leaves only the integral term to raise it. `stalled()` needs that push at the
limit, with the motor not moving, for 200 ms. A coasting motor reads 0. The
rates are illustrative, chosen so the stall-based loop visibly pauses on the
object and the load-based one does not.

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
a secure physical grip. Teaching presets use open target 0 and close target 72 output degrees, homing
and squeeze torque limits of 220 and 180 mNm, and a contact load of 100 mNm. Stage 8's guessed wait is 200 ms;
the 5000 ms observation wait that keeps later scenes alive is left out of the
stage 9 code excerpts.

## Named arguments, literal values

Every argument in the code this deck *displays* names its parameter and gives
the value on the spot: `claw.run_target(speed=120, target_angle=72)`,
`claw.run_until_stalled(speed=-120, then=Stop.COAST)`,
`claw.run_angle(speed=180, rotation_angle=-15)`, `claw.reset_angle(angle=0)`,
`claw.control.limits(torque=220)`. Nothing is positional and nothing is a
constant: no `CLOSE_SPEED` or `CLOSE_TARGET` appears on a slide or in the copyable
`home()` dialog. Downloadable Python files use the course's named facts block. A slide is read
once, on its own, so the reader should never have to look elsewhere to learn
either what a number means or what it is. The parameter names are Pybricks' own,
so the code students copy still runs.

The numbers still come from one place in the source: `FACTS` in `engine.js`
(port E, clockwise, 12-to-20 gears, open speed 180, close speed 120, home torque 220, squeeze
torque 180, contact load 100, open target 0, close target 72). Every code string interpolates
from it, so retuning a value changes the model and the printed code together.
Write new code strings the same way: interpolate from `FACTS` rather than
pasting a bare number, and name the parameter rather than relying on argument
order.

The exception is the course's own `code/claw_gripper.py`, offered on the final
slide and mirrored into `downloads.js`. It keeps its named `CLAW FACTS` block,
which is the repository convention for runnable curriculum code.

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
gear, which drives the 20-tooth right jaw output gear. That gear drives the
20-tooth left jaw gear. Each mesh reverses direction: positive motor rotation
closes both jaws. A 100-degree motor movement produces 60 degrees at each jaw.
The 12-to-20 ratio matches the course claw. The transfer gear carries motion
without changing the ratio; Pybricks is configured with `[12, 20]` for the
chosen right output axle. The second jaw is mechanically linked to it.

`engine.js` defines the shared gear geometry and rotation ratios. The view and
jaw-contact model use these ratios. Resetting the angle reference does not
rotate any gear; a blocked motor stops the complete train.
Run `node slides/claw-lesson/verify-model.cjs` to check the transmission and lesson scenes.

## Course integration

The lesson lives in `slides/programming-the-claw.qmd`; these assets preserve its interactive layout.
`code/claw_gripper.py` is the completed module and `code/claw_starter.py` contains the starting home function.
After editing either, run `python tools/sync-claw-downloads.py` from the course root, then rebuild.
This refreshes the deck's embedded offline downloads from the same files.
