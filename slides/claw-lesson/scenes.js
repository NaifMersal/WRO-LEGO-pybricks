(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./engine.js') : root.ClawEngine);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.ClawScenes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  const F = E.FACTS;
  const base = { start: 0, homed: true, object: 'wide', target: 130, relative: -20, torque: 180, release: 50, objectX: 0, objectY: 0, propX: 154, propY: 255, direction: 'close', pauseZero: true, waiting: 'loop' };
  const v = (id, label, config = {}, question, note) => ({ id, label, config, question, note });
  const scenes = [
    { id: 1, title: 'Follow the motion', short: 'The mechanism', concept: 'One motor. Two linked jaws.',
      question: 'If the motor turns the other way, what will happen to the jaws?',
      choices: ['Both jaws reverse', 'Only one jaw reverses', 'The jaws keep closing'],
      explain: 'Trace the movement from the motor, through the gears, to both jaws. Which direction closes this claw?',
      takeaway: 'One motor controls both linked jaws. Positive motor movement closes this particular claw; negative movement opens it.',
      checkpoint: 'Predict both jaws’ movement from the motor’s direction.',
      notes: 'Keep attention on the mechanism. Ask students to trace the drive through the yellow gears to the magenta arms and cyan tips. The top view simplifies the linkage in the reference photos. Let students open, stop, and close the claw.',
      variants: [v('close', 'Close, then reverse', { object: 'empty', homed: false, start: 0, direction: 'close' }), v('open', 'Open, then reverse', { object: 'empty', homed: false, start: 100, direction: 'open' })] },
    { id: 2, title: 'Same move, different finish', short: 'Relative movement', concept: 'Movement starts where you are.',
      question: 'Will opening by 20° finish at the dotted open-stop outline?', choices: ['Yes, at the outline', 'It will stop too closed', 'It will open too far'],
      explain: 'Why did the same instruction give a different final opening? What movement would reach the outline from this start?',
      takeaway: 'run_angle() requests a change from the current position. The required movement changes with the starting position.',
      checkpoint: 'Explain why a fixed relative movement does not guarantee a fixed final opening.',
      notes: 'Run from a pose 20° from the open stop: −20° reaches the stop. Then run the same −20° from 80°. Students change the movement to −80°. These starting positions describe the model’s physical poses; the motor reference is not established yet.',
      variants: [v('near', 'Start A · same −20°', { object: 'empty', homed: false, start: 20 }), v('far', 'Start B · same −20°', { object: 'empty', homed: false, start: 80 })] },
    { id: 3, title: 'Find home. Then name zero.', short: 'Build home()', concept: 'A physical reference makes a target meaningful.',
      question: 'Where should we start counting, so each target is measured from the same reference?', choices: ['At the rigid open stop', 'At any current opening', 'At the object'],
      explain: 'Which action found the reference? Which action changed its number? Does a zero reading prove the claw is at the stop?',
      takeaway: 'Homing finds a recognizable endpoint and assigns its number. reset_angle(0) alone can call any position zero. After homing, the open stop is 0° and closing targets are measured from there.',
      checkpoint: 'Use home(), explain why targets need a consistent reference, and measure closing targets from the open-stop zero.',
      notes: 'Repeat homing from two positions with empty jaws. Pause before zeroing: the physical endpoint has been reached but the reference has not been assigned. Contrast arbitrary zero, then restore the correct reference. Provide the complete copyable home() function now: Copy and use now; we will explain the internal steps after the experiment. Keep the internal teaching walkthrough folded until stage 5. Students may inspect and copy the code without explaining its implementation yet. The supplied homing torque is 220 mNm.',
      variants: [v('home-a', 'Find stop · start A', { start: 30, homed: false, object: 'empty' }), v('home-b', 'Find stop · start B', { start: 80, homed: false, object: 'empty' }), v('wrong-zero', 'Zero at the wrong place', { start: 70, homed: false, object: 'empty' }, 'If we reset the reading here, have we found home?'), v('ready-a', 'Target from 0°', { start: 0, object: 'empty', target: 60 }, 'How much must the motor move to reach target 60°?'), v('ready-b', 'Target from 30°', { start: 30, object: 'empty', target: 60 }, 'Will the same target 60° reach the same opening from here?'), v('complete', 'Complete home()', { start: 80, homed: false, object: 'empty', pauseZero: false })] },
    { id: 4, title: 'Find an angle that grips', short: 'The angle lab', concept: 'Requested angle and contact angle can differ.',
      question: 'Will your chosen target leave a gap, reach contact, or become blocked before arrival?', choices: ['A gap remains', 'Contact at the target', 'Contact before the target'],
      explain: 'Compare requested and actual angles. Was there contact? Did the motor arrive? Try the same target with a different object width.',
      takeaway: 'Contact depends on object size and position. An object can be held while the requested target remains unreachable.',
      checkpoint: 'Record contact and target arrival separately for several object sizes.',
      notes: 'Change only the target at first. Every trial homes empty, then pauses for object placement. The runner supplies 180 mNm and default waiting. Use Record trial even for a blocked run, discuss, then reset. Changing object size keeps the chosen target; preset buttons restore their own saved values.',
      variants: [v('wide', 'Wide object', { target: 60 }), v('narrow', 'Narrow object', { object: 'narrow', target: 60 }), v('empty', 'No object', { object: 'empty', target: 60 })] },
    { id: 5, title: 'What can a stall tell us?', short: 'Detect resistance', concept: 'Blocked movement is evidence, not proof of a catch.',
      question: 'If a bottle were between your open fingers, could you grip it with your eyes closed?', choices: ['Yes, I could feel resistance', 'I would need to see it', 'I am not sure'],
      explain: 'What did stalled() tell us? What do we still not know about whether an object was caught?',
      takeaway: 'A stall means the motor is being asked to move but cannot continue. The open stop causes a stall too, with no object caught.',
      checkpoint: 'Distinguish completed movement, blocked movement, and a successful catch.',
      notes: 'Use the eyes-closed vote briefly, then return to the claw. Introduce stalled() and connect blockage detection to the home() function students already used. Expand the existing function now. Walk through selecting the homing limit, opening until stalled, coasting, settling, labeling zero, restoring the gripping limit, and finishing at zero. Compare all three scenes. In homing, the demo pauses at the stall detection event; resume to see the command finish and coast. The live stalled() state can then clear, while the event remains in the trace.',
      variants: [v('blocked', 'Object blocks closing'), v('empty', 'Empty · target reached', { object: 'empty' }, 'Will reaching an unobstructed target count as a stall?'), v('home', 'Empty · open stop', { object: 'empty', start: 70, homed: false, pauseAtStall: true }, 'Could the motor stall here without catching an object?')] },
    { id: 6, title: 'Choose how hard to try', short: 'Torque & target', concept: 'Speed, effort limit, target, and actual angle are different.',
      question: 'If an object blocks the motor near 70°, what does the requested 130° mean?', choices: ['A destination beyond contact', 'The measured contact angle', 'The torque at the jaw tips'],
      explain: 'Which setting controls approach speed? Which limits effort? Why can the actual angle be below 130°?',
      takeaway: 'The torque limit is a motor setting in mNm, not a measured jaw-tip force. It persists until changed. home() selects 220; grab() and release() select 180.',
      checkpoint: 'Distinguish speed, torque limit, requested target, and actual motor angle.',
      notes: 'Keep the supplied values in teaching presets. The target should allow intended objects to interrupt closing before arrival. In Explore mode the torque control is qualitative: object compliance and real holding force are not modeled.',
      variants: [v('grip', 'Grip · 180 mNm'), v('home', 'Home · 220 mNm', { object: 'empty', start: 70, homed: false, torque: 220, pauseZero: false }, 'Why does this action select a different effort limit?')] },
    { id: 7, title: 'The program is still waiting', short: 'Default waiting', concept: 'Contact does not make a pending target call return.',
      question: 'When will “2: Continue” appear with default waiting?', choices: ['After target arrival', 'As soon as motion starts', 'As soon as anything touches'],
      explain: 'We reached the object. What is run_target() still waiting for?',
      takeaway: 'wait=True is the default. The call waits for target arrival. An obstruction before the target can keep it pending. Reset scene cancels the trial.',
      checkpoint: 'Explain why contact alone does not release the pending call.',
      notes: 'Run the unobstructed preset first so 130° is visibly reachable. Then repeat the identical code with an object. Keep the code highlight on run_target() and point to the missing second print. Do not add an automatic timeout that disguises the problem.',
      variants: [v('empty', '130° is reachable', { object: 'empty' }), v('blocked', 'Same target · blocked')] },
    { id: 8, title: 'Let the program continue', short: 'wait=False', concept: 'Program progress does not mean the grip is ready.',
      question: 'With wait=False, when will “2: Continue” appear?', choices: ['While the jaws are moving', 'Only after target arrival', 'Only after a stall'],
      explain: 'If the next instruction drove away, would the object necessarily be secured?',
      takeaway: 'wait=False lets the program continue while the motor works. A guessed wait does not check for contact, and if it is short the program ends mid-movement.',
      checkpoint: 'Explain why allowing the program to continue does not establish grip readiness.',
      notes: 'Point to all three panels together: moving jaws, the observation wait, and the unchanged motor target. Playback slows model time without changing the displayed speed constants.',
      variants: [v('blocked', 'Continue · a guessed wait', { observeMs: 200 }), v('empty', 'Continue · empty claw', { object: 'empty' }), v('cut', 'Continue · nothing left to run', { observe: false })] },
    { id: 9, title: 'Wait for either outcome', short: 'The checking loop', concept: 'Keep waiting while not stalled AND not done.',
      question: 'Which two events should end our checking loop?', choices: ['Stalled OR done', 'Stalled AND done together', 'Only a stall'],
      explain: 'Which condition ended this trial? Why would checking only one condition miss the other outcome?',
      takeaway: 'The loop continues only when both checks are False. wait(100) allows startup and wait(10) spaces the checks; neither cancels the motor task.',
      checkpoint: 'Explain the AND condition in words and predict each truth-table row.',
      notes: 'Use both blocked and unobstructed presets. The loop-check counter and alternating condition/wait highlight make polling visible. The underlying intervals stay 100 ms and 10 ms; slow playback can help observation.',
      variants: [v('blocked', 'Loop ends · stalled'), v('empty', 'Loop ends · done', { object: 'empty' }), v('stall-blocked', 'Stall check only', { loopConds: ['stalled'] }), v('stall-empty', 'Stall check only · empty', { object: 'empty', loopConds: ['stalled'] }, 'Which check could end this waiting?')] },
    { id: 10, title: 'The instruction stays active', short: 'Build grab()', concept: 'Leaving a checking loop does not cancel the motor command.',
      question: 'After the loop ends, does the motor still have its closing instruction?', choices: ['Yes, the earlier task remains', 'No, leaving the loop stops it', 'Only if we call run_target again'],
      explain: 'Make the object narrower. Which line gave the motor another closing instruction? What changes when the target itself is reached?',
      takeaway: 'No new closing call is needed. The earlier task continues toward 130° after the loop. At 130°, HOLD maintains that position. An opening command replaces the closing task.',
      checkpoint: 'Compare what ends in home() with what ends in grab(). Returning from grab() does not certify a catch.',
      notes: 'Wait for “Loop ended”, then make the object narrower during the observation wait. Remove it to see arrival at 130°. Repeat the empty outcome: the motor holds at the target without going beyond it. Compare homing, whose built-in operation ends and coasts. Reveal grab() after the explanation.',
      variants: [v('blocked', 'Narrow after the loop'), v('empty', 'Reach 130° · hold', { object: 'empty' }), v('home', 'Compare home() · coast', { object: 'empty', start: 70, homed: false, pauseZero: false })] },
    { id: 11, title: 'Release with room to spare', short: 'Build release()', concept: 'Open only as far as needed.',
      question: 'Will this opening release the object and clear the neighboring prop?', choices: ['Release and clear the prop', 'Release but sweep into the prop', 'Keep the object held'],
      explain: 'Why is 0° more open than 50° on this claw? Justify the smallest opening that releases this object with clearance.',
      takeaway: 'A smaller opening can avoid a neighboring prop. Default waiting is useful because the next mission action follows target arrival. release() uses 0°; release(50) requests 50°.',
      checkpoint: 'Choose a release angle and support it with contact and clearance evidence.',
      notes: 'Start with the object already held. Compare the same scene at 0° and 50°. A sweep intersection is recorded even if the jaws later pass the prop. The clearance model is illustrative. The prop is a visual collision check, not another motor stall constraint.',
      variants: [v('wide-open', 'Wide opening · 0°', { held: true, prop: true, release: 0 }), v('small-open', 'Smaller opening · 50°', { held: true, prop: true, release: 50 })] },
    { id: 12, title: 'Put the functions to work', short: 'Mission trials', concept: 'Predict mechanism, program, and motor task together.',
      question: 'Where will closing stop, why will grab() return, and what will the motor do next?', choices: ['Contact, then maintain effort', 'Reach target, then hold', 'I will test another prediction'],
      explain: 'Explain the reference, target, actual angle, loop outcome, continued motor task, and release clearance for this trial.',
      takeaway: 'home() establishes the reference, grab() waits for stall or completion while retaining its motor task, and release() moves to an opening target.',
      checkpoint: 'Complete the four mission trials with a prediction and an explanation for each.',
      notes: 'The runner pauses after home() for object placement. The one-second wait makes maintained grip visible; a carrying movement can take that place in a mission. For a physical trial, keep homing unobstructed and position the object before grabbing. Empty completion is not a catch.',
      variants: [v('wide', 'Wide object'), v('narrow', 'Narrow object', { object: 'narrow' }), v('empty', 'Empty grab', { object: 'empty' }), v('clearance', 'Release near a prop', { prop: true, release: 50 })] }
  ];
  function configFor(stage, variant = 0) { return { ...base, ...scenes[stage - 1].variants[variant].config }; }
  function programFor(stage, variant, c, explore = false) {
    const p = [], key = scenes[stage - 1].variants[variant].id;
    const add = (text, type, more = {}) => { p.push({ text, type, ...more }); return p.length - 1; };
    const print = message => add(`print("${message}")`, 'print', { message });
    const sleep = (ms, comment = '', scope) => add(`wait(${ms})${comment ? '  # ' + comment : ''}`, 'sleep', { ms, scope });
    const limit = (home = false, scope) => add(`claw.control.limits(torque=${home ? 'HOME_TORQUE' : 'GRIP_TORQUE'})`, 'limit', { value: home ? F.homeTorque : c.torque, scope });
    const move = (target, speed, then = 'HOLD', wait = true, textTarget, scope) => add(`claw.run_target(\n    ${speed === F.openSpeed ? 'OPEN_SPEED' : 'CLOSE_SPEED'}, ${textTarget || target},\n    then=Stop.${then}${wait ? '' : ', wait=False'}\n)`, 'move', { target, speed, then, wait, scope });
    const gate = (message, action) => add('', 'gate', { message, action });
    function home(pause = c.pauseZero, scope) {
      limit(true, scope);
      add('claw.run_until_stalled(\n    -CLOSE_SPEED, then=Stop.COAST\n)', 'homeRun', { speed: F.closeSpeed, then: 'COAST', scope });
      sleep(200, '', scope);
      if (pause) gate('We found the stop. Have we called it zero yet? Resume to assign zero.');
      add('claw.reset_angle(0)', 'zero', { scope }); limit(false, scope);
    }
    // The condition is built one check at a time across stage 9, so the op carries
    // the checks it makes and the code panel renders whichever it was given.
    function loop(scope, conds) {
      sleep(100, '', scope);
      const to = add('while not claw.stalled() and not claw.done():', 'check', { scope, conds });
      sleep(10, '', scope); p[p.length - 1].text = '    wait(10)';
      add('', 'jump', { to, scope });
    }
    function close(wait, withLoop = false, scope) {
      move(c.target, F.closeSpeed, 'HOLD', wait, c.target === F.gripTarget ? 'GRIP_TARGET' : String(c.target), scope);
      if (withLoop) loop(scope, c.loopConds);
    }
    if (explore) {
      limit(); print('1: Start closing'); close(c.waiting === 'default', c.waiting === 'loop'); print('2: Continue'); sleep(5000, 'Observation time');
    } else if (stage === 1) {
      const relative = (c.direction === 'close' ? 130 : 0) - c.start;
      add(`claw.run_angle(${c.direction === 'close' ? 'CLOSE_SPEED' : 'OPEN_SPEED'}, ${relative}, then=Stop.COAST)`, 'move', { relative, speed: c.direction === 'close' ? F.closeSpeed : F.openSpeed, then: 'COAST' });
      gate('Pause before reversing: predict what both jaws will do. Resume to reverse.');
      const reverse = c.direction === 'close' ? -130 : 130;
      add(`claw.run_angle(${c.direction === 'close' ? 'OPEN_SPEED' : 'CLOSE_SPEED'}, ${reverse}, then=Stop.COAST)`, 'move', { relative: reverse, speed: c.direction === 'close' ? F.openSpeed : F.closeSpeed, then: 'COAST' });
    } else if (stage === 2) {
      add(`claw.run_angle(OPEN_SPEED, ${c.relative})`, 'move', { relative: c.relative, speed: F.openSpeed, then: 'HOLD' });
    } else if (stage === 3) {
      if (key.startsWith('ready')) { print('Closing to target'); move(c.target === F.gripTarget ? 60 : c.target, F.closeSpeed); print('Target reached'); }
      else if (key === 'wrong-zero') { add('claw.reset_angle(0)', 'zero'); gate('The reading is zero but the jaws are partly closed. Resume to restore the reference by homing.'); home(true); }
      else home();
    } else if (stage === 4 || stage === 12) {
      // Object placement is a teaching action, not a Python wait statement.
      home(false, 'gripper.home()');
      gate(c.object === 'empty' ? 'Home complete. Keep the claw empty for this trial, then continue.' : 'Home complete. Place the selected object, then continue.', s => { s.object = E.objectFor(c.object, c.objectX, c.objectY, c.width); });
      limit(false, stage === 12 ? 'gripper.grab()' : undefined);
      close(stage === 4, stage === 12, stage === 12 ? 'gripper.grab()' : undefined);
      if (stage === 12) { if (key === 'clearance') gate('The object is held. Place the neighboring prop for the release test, then continue.', state => { state.prop = { x: c.propX, y: c.propY, w: 34, h: 52 }; state.propHit = false; }); sleep(1000, 'Maintained grip', 'wait(1000)'); limit(false, 'gripper.release()'); move(c.release === 50 && key !== 'clearance' ? F.openTarget : c.release, F.openSpeed, 'COAST', true, key === 'clearance' ? String(c.release) : 'OPEN_TARGET', key === 'clearance' ? `gripper.release(${c.release})` : 'gripper.release()'); }
    } else if (key === 'home' && [5, 6, 10].includes(stage)) home(false);
    else if (stage === 11) { limit(); move(c.release, F.openSpeed, 'COAST', true, String(c.release)); }
    else {
      if ([5, 6, 10].includes(stage)) limit();
      print('1: Start closing');
      const blocking = stage === 7;
      close(blocking, stage === 9 || stage === 10);
      // Without a trailing wait the program simply ends, which is the whole point of
      // the first stage 8 slide; the second guesses a length for it.
      print('2: Continue');
      if (!blocking && c.observe !== false) { sleep(c.observeMs ?? 5000, 'Observation time'); p[p.length - 1].part = 'observe'; }
    }
    return p;
  }
  const functions = `from pybricks.parameters import Direction, Port, Stop
from pybricks.pupdevices import Motor
from pybricks.tools import wait

CLAW_PORT = Port.E
CLAW_DIRECTION = Direction.CLOCKWISE
OPEN_SPEED = 300
CLOSE_SPEED = 200
OPEN_TARGET = 0
GRIP_TARGET = 130
HOME_TORQUE = 220
GRIP_TORQUE = 180

claw = Motor(CLAW_PORT, CLAW_DIRECTION)
claw.control.limits(torque=GRIP_TORQUE)

def home():
    claw.control.limits(torque=HOME_TORQUE)
    claw.run_until_stalled(-CLOSE_SPEED, then=Stop.COAST)
    wait(200)
    claw.reset_angle(0)
    claw.control.limits(torque=GRIP_TORQUE)

def grab():
    claw.control.limits(torque=GRIP_TORQUE)
    claw.run_target(CLOSE_SPEED, GRIP_TARGET,
                    then=Stop.HOLD, wait=False)
    wait(100)
    while not claw.stalled() and not claw.done():
        wait(10)

def release(angle=OPEN_TARGET):
    claw.control.limits(torque=GRIP_TORQUE)
    claw.run_target(OPEN_SPEED, angle, then=Stop.COAST)
`;
  return { scenes, configFor, programFor, functions };
});
