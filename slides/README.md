# Slide decks and the 25-session schedule

Decks keep their topic filenames and URLs. **S1–S25 are calendar sessions; D labels are legacy lesson keys**, retained in subtitles and coaching references. A split lesson can cross a week boundary. The landing page and subtitles use the session schedule below.

Curriculum source: `docs/Robot_Rockstars_Bootcamp_Plan.md` (local coach plan). The plan and decision log stay private under the ignored `docs/` directory. Decision #67 records this reallocation and supersedes the old lists/runner plan.

## Published decks

| Session | Lesson key | Deck | Teaching focus |
|:--:|---|---|---|
| 1–2 | D1 | [build-and-test.qmd](build-and-test.qmd) | Build, checks and power-on |
| 3 | D2, part 1 | [make-it-move.qmd](make-it-move.qmd) | Commands, variables, speed and wheel distance |
| 4 | D2, part 2 | [beam-balance.qmd](beam-balance.qmd) | Derive the distance conversion |
| 5 | D3, part 1 | [while-loops.qmd](while-loops.qmd) | Motor primitives, while tracing and debugging |
| 6 | D3, part 2 | [drive-a-square.qmd](drive-a-square.qmd) | for, signed heading, abs, gyro turns and shapes |
| 7 | D4a | [cure-the-coast.qmd](cure-the-coast.qmd) | First def and two-speed turn |
| 8 | D4b | [write-it-yourself.qmd](write-it-yourself.qmd) | Independent writing and the bare-file gate |
| 9 | D4c | [pid-on-the-gyro.qmd](pid-on-the-gyro.qmd) | P control, plain parameters and tuning |
| 10 | D5 | [name-your-moves.qmd](name-your-moves.qmd) | D, modules, defaults before use, if/else; optional I and square |
| 11 | D6 | [pd-line-following.qmd](pd-line-following.qmd) | Scope recap, calibrated eye, elif, P, not/and/or before squaring |
| 12 | D7 | [stop-patrol-react.qmd](stop-patrol-react.qmd) | Required reverse upgrade, stall sensing and wall resets |
| 13 | D8 | [drivebase-shortcut.qmd](drivebase-shortcut.qmd) | Robot facts, then DriveBase, then migration and Gauntlet |
| 14 | D10 | [draft-day.qmd](draft-day.qmd) | Direct-call Mini Mission, teams and mechanism kickoff |
| 15 | D11, build/gears | [gears.qmd](gears.qmd) | Finish a working mechanism; direction, ratio, speed and torque; configure the 12-to-20 gear train in Pybricks |
| 16 | D11, claw | [programming-the-claw.qmd](programming-the-claw.qmd) | Output angle from home; home/grab/release with stall and done checks; both bench trials |

## Complete schedule

| Session | Week | Lesson key | Focus | Outcome |
|:--:|:--:|---|---|---|
| 1–2 | 1 | D1 | Build Your Robot | Build individually; power-on and quality checks |
| 3 | 1 | D2, part 1 | Make It Move | Motor commands, variables, speed and a first distance conversion |
| 4 | 1 | D2, part 2 | The Beam Balance | Derive distance-to-degrees and solve fresh distances unaided |
| 5 | 1 | D3, part 1 | Until It’s True | Trace, debug and write a while loop on a wheel angle |
| 6 | 2 | D3, part 2 | Drive a Square | Counted loops, signed heading, abs and watched turns |
| 7 | 2 | D4a | Cure the Coast | Two-speed turn; define and call a function |
| 8 | 2 | D4b | Write It Yourself | Protected independent coding; bare-file distance/function gate |
| 9 | 2 | D4c | The Drive That Heals Itself | P turns, tuning and self-healing straight practice |
| 10 | 2 | D5 | Name Your Moves | D braking, defaults, by/to, if/else and the motion library; I and square are optional |
| 11 | 3 | D6 | Line King | Reflection, calibration, elif, P following, Boolean checks and squaring; line-PD is optional |
| 12 | 3 | D7 | Stop at the Wall | Teach reverse first, then stall, back-off, patrol and wall resets |
| 13 | 3 | D8 | The Earned Shortcut | Robot facts, DriveBase migration and the Gauntlet |
| 14 | 3 | D10 | Draft Day | Direct-call Mini Mission; form teams and begin the first mechanism |
| 15 | 3 | D11, build/gears | Build and Gears | Finish a working mechanism before the gear lab; configure its 12-to-20 claw ratio |
| 16 | 4 | D11, claw | Programming the Claw | Read output angle from home; home, grab and release; object and empty trials on the bench |
| 17 | 4 | merged mechanism work | Mechanism practice | Match `gears` to each build, retune output targets, and adapt the three functions; repeated grabs, carry/release and instrument trials |
| 18 | 4 | D18 | Plan and run the first tasks | Select/consolidate the team robot, mark route/reset points, then run cable/microphone call sequences |
| 19 | 4 | D19 | Instruments and avoidance | Integrate instrument placement and the avoidance path; five logged runs |
| 20 | 4 | D20 | Chain the anchor | Complete the ~135 anchor using direct calls or named task functions; target ≥5/10 clean |
| 21 | 5 | D21 | Tune the whole run | Tune from the failure log; protect the complete chain |
| 22 | 5 | D22 | Reliability practice | Repeated runs, root causes and calibration; work toward ≥18/20 clean |
| 23 | 5 | D23 | Robustness and explanation | Perturbed starts, lighting checks and resets; finish the ongoing Technical Summary |
| 24 | 5 | D24 | Mock qualifier | Check-time, one-button run and Surprise Rule; final ~135 anchor gate ≥18/20 |
| 25 | 5 | D25 | Showcase and handoff | Both teammates explain the robot; selection and continuation plan |

## What gives the foundations room

- **Lists and the generic mission runner are removed from the core course.** Legacy D9/D16 are retired lesson slots, not missing decks. Do not restore `mission-list.qmd` as a prerequisite. Students write ordinary movement/gripper calls in order and can group a complete task in a named function in their main program.
- **Mechanism verbs are taught in Programming the Claw and practised on each build in S17.** There is no additional full introductory mechanism-programming day.
- **Route planning shares S18 with robot consolidation and the first integrated tasks.** Mark the physical reset points before driving the route.
- **Failure logging and calibration accompany bench work.** From the first chained tasks, reserve five logged trials each day. S21–S24 use that evidence to improve and prove the complete run.
- **The Technical Summary grows in short documentation blocks from the mechanism build onward.** Final review is part of S23, not a separate new lesson.
- **Fixed notes are optional after the ≥18/20 anchor gate.** Randomized notes, full-255 work, lists/runners and advanced HSV work belong to continuation or spare extension time. Previously deferred notes are not counted again as newly recovered sessions.

## Delivery rules

- Preserve S8 independent writing. The blocking gate is a fresh distance conversion, a function using it, and a call, all produced from a bare file. Help is followed by a fresh unaided attempt.
- D5 teaches D with plain parameters, then defaults before library use. I is an optional demonstration and the square is a stretch; neither is a gate. Keep precision benchmarks and P/D explanation.
- D7 upgrades and tests forward, backward and zero-distance calls before any wall back-off. One-eye robots square on a wall; two-eye robots may square on a line.
- D8 introduces DriveBase before showing its code. Keep the same constants-block habit across the migration.
- Draft Day guarantees a sketch and a build kickoff. S15 includes completion time; Gears needs a working mechanism or the coach's prepared demonstration. Freeze the chassis and use fixed mounting points.
- Week 4 aims for a complete anchor, initially ≥5/10 clean. Week 5 proves the final ~135-point anchor at ≥18/20. If S20 does not chain, use S21–S22 for integration and remove the fixed-note extension.
- Use topic names in transitions. Recap filenames retain their original day labels for URL stability: Part 1 supports S3–S10; Part 2 supports S10–S13. The cheat sheet starts at S10 and its gripper section becomes relevant at S16.

S17–S25 are planned bench/integration/reliability blocks; separate slide decks have not been authored. The landing page describes them without linking nonexistent files.
