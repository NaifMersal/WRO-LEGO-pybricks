# Slide decks — day → deck map

One reveal.js deck per curriculum day, named by **topic** (not day number), so reordering the
curriculum never breaks file paths or rendered URLs.

> **Convention:** day numbers live only in each deck's front-matter `subtitle` and in this table —
> **never** in filenames or slide prose. Inside decks, refer to other sessions by topic
> ("next: *Drive a Square*"), not by day number. When the schedule changes, update this table and
> the affected subtitles; nothing else moves. (Proven by decision #20: the `DriveBase` reveal moved
> D5 → D10 and `drivebase-shortcut.qmd` kept its name and URL.)

Curriculum source: `docs/Robot_Rockstars_Bootcamp_Plan.md` — the week-by-week day table and the
D1–D25 authoring map.

> 📁 **`docs/` is coach-side and is not in this repository.** The plan, the decision log and the
> robot specs are the working record of a live cohort and are not distributed, so every `docs/…`
> path cited here and in the decks resolves only on the coach's own machine. See the root
> `README.md` § *What is not here, and why*.

Kid-facing landing page: root `index.qmd` → `output/index.html` — a colorful card grid of all 25
sessions. **D1–D8 and D11 link to their decks; every other day shows "Coming soon."** The cheat
sheet and the two recap arcades sit in their own *Reference & Practice* section at the end, so a
week section holds day decks only. Update the cards when a planned deck goes live.

## Week 1 — Build, Drive, Sense

| Day | Deck | Topic |
|:--:|---|---|
| D1 | [build-and-test.qmd](build-and-test.qmd) | Welcome + WRO orientation, bench tour, build a great base (2–3 h), power-on gate |
| D2 | [make-it-move.qmd](make-it-move.qmd) | Human-robot game, first program + variables, speed = distance ÷ time, deg/s → cm/s wheel math, `run_time` vs `run_angle`, *Radar Gun* |
| D2 · s2 | [beam-balance.qmd](beam-balance.qmd) | ⚖️ Unplugged maths opener (#31): paper `=` vs Python `=`, − and + on a fair beam, **break it** — one *object* off each side tips 6 🍊 = 3 🍌 (same count, different amount), × as repeated addition + commutativity by rotating a dot rectangle, ÷ **as** the isolate-one-unit move, then `27.6 × t = 30` → **391°** and their own `degrees = (distance ÷ C) × 360` |
| D3 | [drive-a-square.qmd](drive-a-square.qmd) | Break-it square (turns drift), `for`/`while` + colon/indent bug hunts, feel the gyro, watched turn → momentum quiz, loop shapes (360 ÷ n), *Shape Shifter* |
| D4 | [pid-on-the-gyro.qmd](pid-on-the-gyro.qmd) | Coast cured (arrive slowly) → two-speed `gyro_turn` + first `def` (+ "silent robot" bug hunt), P-term felt then named: `speed = error × KP` turn + self-healing straight, KP tuning, *Nudge Wars* |
| D5 | [name-your-moves.qmd](name-your-moves.qmd) | D + I complete PID (I = coach demo only), then the library begins: `movements.py` with `turn(angle, absolute=False)` · `drive_straight` · `drive_square`, *Bullseye* on their own `drive_straight` |

> 🔧 **Cohort-2 rework owed on the D4 and D5 decks before they run again** (decisions #53, #55, #56):
> **(a)** `pid-on-the-gyro.qmd` **splits three ways** — D4a first `def` only · D4b **production day, nothing new** · D4c the P-term. `abs()` moves back to D3 (with the five-minute number line) and **parameter defaults move forward to D5**; today both arrive on D4 inside a single speaker note. *(The subtitle now reads D4a–4c; the deck itself is still one file.)*
> **(b)** ✅ **Done.** D5 now teaches ***by* vs *to*** on the verb itself — `turn(angle, absolute=False)`, the same signature Pybricks gives `DriveBase.turn()`, revealed as such at D8. `turn_to`/`turn_by` are gone from the curriculum and from `code/movements.py`.
> **(c)** ✅ **Done.** `my_lib.py` → `movements.py` everywhere, and the D8 deck's `RobotConfig` class is replaced by a `ROBOT FACTS` constants block. No classes remain in any deck.
> **(d)** The cheat sheet is handed out at **D5**, not D8.

## Week 2 — Program the Robot, Build the Library, Form the Teams

| Day | Deck | Topic |
|:--:|---|---|
| D6 | [pd-line-following.qmd](pd-line-following.qmd) | The robot opens its eyes: reflection reads + per-surface threshold + first `if/elif`, bang-bang → P line-following (third `error × KP`) + junction squaring (the gate); `kd` stretch; `follow_line` + `square_on_line` (two eyes — the one-eye robot squares on a wall) into `movements.py` |
| D7 | [stop-patrol-react.qmd](stop-patrol-react.qmd) | Motor-as-sensor (`run_until_stalled` + measured back-off), patrol loop (reusing the calibrated eye), `drive_to_wall` + `wall_square` into `movements.py`, anchor-first scoring map |
| D8 | [drivebase-shortcut.qmd](drivebase-shortcut.qmd) *(⚠️ still carries a Draft Day section — old-D10 content; removing it is **open decision #5**, a coach call)* | Library consolidation into one module (Good Practices) + the `ROBOT FACTS` block + the earned `DriveBase` reveal/migration — including the payoff that their hand-built `turn(angle, absolute=False)` *is* Pybricks' signature, so the verb gets deleted — + *Gauntlet* on the migrated library |
| D16 | *(planned — deck TBD)* **The deck authored for this day was withdrawn from the site on 2026-09-06; recover it with `git show 5c9994d:slides/mission-list.qmd`.** Kept in this table because it closes the Week-2 library arc; the Week-4 table below also lists a D16 and that table is stale, see its banner. | Lists (index/iterate/append), steps as functions, the blocking mission runner over the migrated library, end-of-week benchmarks + gold-reference validation, *Setlist* |
| D10 | *(planned — deck TBD)* | Draft Day morning: team split + robot selection + `ROBOT FACTS` merge onto the selected robot, *Mini Mission* finale → mechanism build #1 kicks off (cables + microphone) |

## Week 3 — Build the Mechanisms, Chain the Anchor Run

| Day | Deck | Topic |
|:--:|---|---|
| D11 | [gears.qmd](gears.qmd) | Gear direction, ratio, and the trade-off between speed and torque. |
| D11 · companion | [programming-the-claw.qmd](programming-the-claw.qmd) | Interactive claw lesson: relative and target movement, open-stop homing at 0°, stalled and done checks, three functions, then an object and an empty trial on the bench build. |
| D12 | `instruments-and-avoidance.qmd` *(planned)* | Team mechanism build #2: instruments (45) + bonus-by-avoidance (+40) |
| D13–D14 | *(planned — day split set at the Draft-Day planning pass)* | Segments integrated into the mission runner |
| D15 | `assemble-anchor-run.qmd` *(planned)* | Full ~135 anchor chained end-to-end |

## Week 4 — Make It Reliable

> 🚨 **This Week 4–5 table is STALE — it predates decisions #26, #28 and #30, and it is what
> misled an outside reviewer into critiquing a ~175 gate that no longer exists.**
> `docs/Robot_Rockstars_Bootcamp_Plan.md` is authoritative for every day number and every gate
> below. The plan's Week 4 now reads **D16 lists + runner · D17 mechanism verbs · D18 mission
> planning + robot consolidation · D19 instruments + avoidance · D20 chain the anchor**, and the
> **gated deliverable is the ~135 anchor at ×20 ≥ 90 %** (#30) — ~175 is a D24 stretch, taken
> only after the lock passes. **The planned-deck rows below have not been re-dated against that;
> do it before authoring any of them.**

| Day | Deck | Topic |
|:--:|---|---|
| D16 | `lock-the-anchor.qmd` *(planned)* | Anchor ≤ 2:00, ×10 clean |
| D17 | `reliability-root-cause.qmd` *(planned)* | Failure logging, root-cause, calibration log |
| D18 | *(planned — deck TBD)* **The deck authored for this day was withdrawn from the site on 2026-09-06; recover it with `git show 5c9994d:slides/plan-the-path.qmd`.** | 🗺️ **Mission planning on the map** (#42): route-in-your-own-words break-it → the 12° that never comes back → `tools/odommap/` odometry mode as `reset_heading(0)` made visible → **both heading frames named** (map/Pybricks 0 = up clockwise vs `field_data.py` 0 = +X, `map = field + 90`) → the forced cable orientation (128 mm vs 79.7 mm; 100°/80° field = **190°/170°** robot) → path plan with marked reset points, *Cartographers* |
| D18 | `fixed-notes-tech-summary.qmd` *(planned)* | Fixed notes (+40 → ~175 **as a D24 stretch**, not a gate), Technical Summary draft |
| D19 | `robustness-hsv.qmd` *(planned)* | HSV calibration, retry logic, venue hardening |
| D20 | `reliability-checkpoint.qmd` *(planned)* | Week-4 gate: **~135 anchor chained end-to-end, ≥ 5/10 clean (pre-lock)** — the ×20 lock is Week 5's job |

## Week 5 — Color, Notes & the Mock Qualifier

| Day | Deck | Topic |
|:--:|---|---|
| D21 | `randomized-notes.qmd` *(planned)* | Color → target map, randomized notes (+80 stretch) |
| D22 | `tech-summary-drill.qmd` *(planned)* | Summary finalized, both members interview-ready |
| D23 | `mock-qualifier.qmd` *(planned)* | Check-time sim, Surprise Rule, head-to-head |
| D24 | `full-255-push.qmd` *(planned)* | Full-255 chase + lock the strongest config |
| D25 | `selection-handoff.qmd` *(planned)* | Selection, continuation plan, showcase |
