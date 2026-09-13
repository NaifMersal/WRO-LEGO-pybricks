/* Presentation checkpoints built from the Claw Lab teaching engine. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./engine.js') : root.ClawEngine,
                      typeof module === 'object' && module.exports ? require('./scenes.js') : root.ClawScenes);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClawPresentation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E, S) {
  'use strict';
  const copy = x => JSON.parse(JSON.stringify(x));
  const cache = {};
  const stops = {
    printed: s => s.log.length >= 2,
    complete: s => s.finished,
    blocked: s => s.stalled,
    observing: s => s.log.length >= 2 && s.waiting?.kind === 'sleep',
    checked: s => s.checkCount > 0,
    startup: s => s.waiting?.kind === 'sleep' && s.program[s.active]?.ms === 100,
    /* A loop that only checks stalled() never leaves an empty trial: the movement
       finished within target tolerance, so the checks carry on past completion. */
    spinning: s => s.done && s.checkCount > 60,
    released: s => s.log.some(x => x.text === 'Released')
  };
  function until(s, stop) {
    for (let i = 0; i < 10000; i++) {
      E.tick(s);
      if (stops[stop](s)) return s;
      if (s.paused) throw new Error('Scene paused before checkpoint: ' + stop);
    }
    throw new Error('Checkpoint not reached: ' + stop);
  }
  function start(stage, variant, settledExample = false) {
    const c = S.configFor(stage, variant);
    const s = E.newState(c);
    const program = S.programFor(stage, variant, c);
    if (settledExample) {
      // This slide illustrates 132° actual for 130° requested, within a 3°
      // position tolerance once stopped. Other slides retain exact target arrival.
      Object.assign(program.find(p => p.type === 'move'), { settleOffset: 2, positionTolerance: 3 });
    }
    E.start(s, program);
    return s;
  }
  const recipes = {
    'default-empty-start': () => start(7, 0),
    'default-wide-start': () => start(7, 1),
    'default-empty-end': () => until(get('default-empty-start'), 'printed'),
    'default-wide-blocked': () => until(get('default-wide-start'), 'blocked'),
    /* The same three instructions with nothing after them: the program is over
       before the motor has turned. */
    'cut-start': () => start(8, 2),
    'cut-end': () => until(get('cut-start'), 'complete'),
    /* A guessed 200 ms: long enough to look reasonable, and the program is over
       before the jaws are anywhere near the object. */
    'fixed-start': () => start(8, 0),
    'fixed-end': () => until(get('fixed-start'), 'complete'),
    'stall-wide-start': () => start(9, 2),
    'stall-wide-end': () => until(get('stall-wide-start'), 'observing'),
    'stall-empty-start': () => start(9, 3, true),
    'stall-empty-spin': () => until(get('stall-empty-start'), 'spinning'),
    'loop-wide-start': () => start(9, 0),
    'loop-wide-end': () => until(get('loop-wide-start'), 'observing'),
    'loop-empty-start': () => start(9, 1, true),
    'loop-empty-end': () => until(get('loop-empty-start'), 'observing'),
    /* release() opens from the grip the checking loop left behind. */
    'release-start': () => {
      const s = get('loop-wide-end');
      s.log = [];
      E.start(s, [
        { type: 'limit', value: E.FACTS.gripTorque, text: 'claw.control.limits(torque=GRIP_TORQUE)' },
        { type: 'move', target: E.FACTS.openTarget, speed: E.FACTS.openSpeed, then: 'COAST', wait: true,
          text: 'claw.run_target(\n    OPEN_SPEED, OPEN_TARGET,\n    then=Stop.COAST\n)' },
        { type: 'print', message: 'Released', text: 'print("Released")' }
      ]);
      return s;
    },
    'release-end': () => until(get('release-start'), 'released')
  };
  function get(name) {
    if (!cache[name]) {
      if (!recipes[name]) throw new Error('Unknown snapshot ' + name);
      cache[name] = recipes[name]();
    }
    return copy(cache[name]);
  }
  const cue = (state, more = {}) => ({ state, status: 1, ...more });
  /* One slide per question. A cue with phases keeps the frames of the separate
     predict, observe and explain slides it replaces: each phase is one press,
     re-seeding the scene, running to its stop, and taking over the heading. */
  const cues = {
    'empty': cue('default-empty-start'),
    'blocked': cue('default-wide-start'),
    'default-argument': cue('default-wide-blocked', { explicitWait: true, focus: 'argument' }),
    'async': cue('cut-start', { focus: 'argument' }),
    'fixed-wait': cue('fixed-start', { waitTimer: true }),
    'stall-loop': cue('stall-wide-start', { stepCode: true }),
    'done-check': cue('stall-empty-start'),
    'release': cue('release-start', { status: 2 })
  };
  const views = {
    /* The trailing observation wait only keeps the scene alive for discussion, so
       stage 9 reads the loop as the function will contain it. */
    'stall-loop': { show: ['start', 'move', 'startup', 'check', 'poll', 'continue'], console: 'last' },
    /* The finished condition makes the loop four lines, so the empty trial reads the
       loop alone: with the prints out of the excerpt, their console goes out too. */
    'done-check': { show: ['move', 'startup', 'check', 'poll'], console: 'none' }
  };
  const phases = {
    'empty': [
      {title:'The program waits for the empty claw to close', label:'Observe', stop:'printed'},
      {title:'The call returns after target arrival', label:'Explain', state:'default-empty-end', stop:null}
    ],
    'blocked': [
      {title:'The object stops closing before the target', label:'Observe', stop:'blocked'},
      {title:'The program is waiting for 130°', label:'Explain', state:'default-wide-blocked', focus:'target', stop:null}
    ],
    /* Three instructions and nothing else: the program outruns the motor, and
       ending it releases the drive where the jaws happen to be. */
    'async': [
      {title:'“Continue” appears while the jaws move', label:'Observe', focus:null, rate:0.025, stop:'printed'},
      {title:'The program ends before the jaws have moved', label:'Explain', rate:0.025, focus:'target',
       caption:'Ending a program releases the motor where it is.', stop:'complete'}
    ],
    /* The guess is too short, so the program ends before the jaws even touch the
       object: choosing a longer number would only be a better guess. */
    'fixed-wait': [
      {title:'The program ends before the jaws touch the object', label:'Observe', stop:'complete'},
      {title:'A wait measures time, not the motor', label:'Explain', focus:'target',
       caption:'A longer number would still be a guess.', stop:null}
    ],
    'stall-loop': [
      {title:'stalled() ends the waiting at the object', label:'Observe',
       focus:'check', stop:'observing'}
    ],
    /* A small settled position error still allows completion. The empty claw never
       stalls, so the program needs done() to stop waiting. */
    'done-check': [
      {title:'Actual: 132°. Target: 130°. Still waiting.', label:'Observe',
       caption:'The motor has settled slightly past the target. stalled() stays False.', stop:'spinning'},
      {title:'claw.done() lets the loop finish', label:'Observe',
       state:'loop-empty-start', status:2, focus:'check',
       caption:'Illustrative reading: the motor has settled within the completion tolerance.', stop:'observing'},
      {title:'The loop ended with nothing between the jaws', label:'Explain', focus:'done',
       caption:'132° actual > 130° requested. done() is True, and the claw is empty.', stop:null}
    ],
    'release': [
      {title:'The jaws open to 0° and let the object go', label:'Observe', stop:'released'},
      {title:'This sequence is release()', label:'Explain', state:'release-end',
       caption:'The same shape as grab(): choose the effort limit, then run to a target.', stop:null}
    ]
  };
  for (const [id, view] of Object.entries(views)) Object.assign(cues[id],view);
  for (const [id, list] of Object.entries(phases)) cues[id].phases = list;
  return { get, cues, stops, until, copy, snapshotNames: Object.keys(recipes) };
});
