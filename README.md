# Robot Rockstars 🎸🤖

A five-week youth robotics bootcamp that takes beginners from a box of LEGO to a competition-ready
robot for the **WRO 2026 RoboMission Elementary** season (*"Robot Rockstars"*), on **LEGO SPIKE
Prime programmed in Python with [Pybricks](https://pybricks.com/)**.

**▶ The course portal is the thing to look at: <https://naifmersal.github.io/WRO-LEGO-pybricks/>** —
a card grid of all 25 sessions, each opening a reveal.js deck, plus the recap arcade and the field
tool.

---

## 📦 What is in this repository

| Path | What it is |
|:--|:--|
| `index.qmd` | The kid-facing landing page — the card grid of all 25 sessions. |
| `slides/` | One reveal.js deck per curriculum day, named by **topic**, never by day number. `slides/README.md` is the day → deck map. |
| `library-cheatsheet.qmd` | Every verb the students own, on one page. Handed out at D5. |
| `interactives/` | Hand-written standalone HTML the decks link or iframe: the Recap Arcade (master + its two generated sittings) and the Beam Balance catch-up lab. |
| `code/` | Pybricks reference programs, including `claw_gripper.py` and `lift_gripper.py`. The claw lesson's `claw_starter.py` contains the starting `home()` function. |
| `tools/odommap/` | Vendored field measuring tool (see attribution below), used coach-side for route planning and student-facing in the path-planning session. |
| `slides_template/` | Shared branding and the deck scaffold: SCSS theme, logo, splash filter. |
| `handouts/` | Printables. |

**One layout rule:** repo root = Quarto site pages · `slides/` = reveal decks · `interactives/` =
hand-written standalone HTML. Put a new page in the matching place and list it in `_quarto.yml` if
it is not a `.qmd`.

## 🛠️ Requirements

- **Hardware** — LEGO SPIKE Prime Core Set (45678) + Expansion Set (45681).
- **Firmware** — [Pybricks](https://pybricks.com/), which replaces the SPIKE Hub OS with
  MicroPython + the Pybricks API. Flash it once per hub, then write code in the
  [Pybricks Code Editor](https://code.pybricks.com/).
- **Site build** — [Quarto](https://quarto.org/) ≥ 1.8.26.

```bash
quarto preview          # live-reload the whole site
quarto render           # build into output/
quarto preview index.qmd   # just the portal
```

`output/` is generated and ignored; the built site is published to the `gh-pages` branch.

---

## 📐 Domain invariants

Constraints that recur through every deck and must not drift:

1. **Robot limits (WRO General Rules §5).** ≤ 250 × 250 × 250 mm at the start · ≤ 1.5 kg · one
   controller hub · **no wireless link between components** (Bluetooth/Wi-Fi off, program
   downloaded by cable) · one physical start/stop button.
2. **The 4-motor cap binds before the port budget — and which one you mean matters.** The *stock*
   LEGO Education Advanced Driving Base fills all 6 hub ports (2 large drive + 2 medium tool motors
   + 2 colour sensors), leaving nothing for a distance sensor. **This build is not the stock kit:**
   it runs **one** colour sensor, so **port A is free** — while its four motors sit exactly at
   Elementary's **maximum of 4** (§5.2.8). Wall detection is by motor-stall detection and gyro
   heading, not by a distance sensor.
3. **Pedagogy — "break it → feel it → fix it".** Everything is delivered live in class, with no
   pre-work dependency. Open with a naive approach that fails visibly (open-loop drift), let the
   students feel the limitation, and introduce the technique as the rescue.
4. **Anchor-first scoring.** The foundation is the **~135-point anchor run with no colour sensing**
   (instruments 45 + cables 30 + bonus-by-avoidance 40 + microphone 20), and **~135 locked to ×20
   ≥ 90 % is the gated five-week deliverable**. The two fixed notes (+40 → ~175) are a **D24
   stretch** taken only after the lock passes; the four randomized notes (+80) and 255-point
   consistency open the continuation season. Never trade a reliable gated run for a shakier full
   one.

The WRO rules themselves are not redistributed here — get them from
[World Robot Olympiad](https://wro-association.org/competition/season-2026/).

---

## ⚖️ Licence and attribution

- **Code** (`code/`, and the scripts inside the interactives) — [MIT](LICENSE).
- **Curriculum content** (`slides/`, `index.qmd`, `library-cheatsheet.qmd`, `interactives/`) —
  [CC BY 4.0](LICENSE-CONTENT).

Third-party material keeps its own terms:

- **OdomMap** (`tools/odommap/`) — vendored from [haing2811/OdomMap](https://github.com/haing2811/OdomMap),
  MIT licensed, © the upstream author. Its `LICENSE` ships alongside it. Only the files this
  bootcamp needs are included; other years and categories were dropped.
- **World Robot Olympiad** — the RoboMission rules, the game description and the field/mat artwork
  are WRO's. They are referenced and measured against here, not relicensed or redistributed.
- **LEGO**, **SPIKE** and **Pybricks** are trademarks of their respective owners. This project is
  not affiliated with, endorsed by, or sponsored by the LEGO Group, WRO, or Pybricks.
