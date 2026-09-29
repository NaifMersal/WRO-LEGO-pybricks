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
    /* A loop that only checks the load never leaves an empty trial: the movement
       reached its target with nothing to press on, so the checks carry on. */
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
  function start(stage, variant) {
    const c = S.configFor(stage, variant);
    const s = E.newState(c);
    const program = S.programFor(stage, variant, c);
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
    /* The loop students propose first, from stage 5: it works, after a pause. */
    'stall-wide-start': () => start(9, 2),
    'stall-wide-end': () => until(get('stall-wide-start'), 'observing'),
    /* The same loop watching load() instead leaves as soon as the jaws press. */
    'load-wide-start': () => start(9, 4),
    'load-wide-end': () => until(get('load-wide-start'), 'observing'),
    'load-empty-start': () => start(9, 3),
    'load-empty-spin': () => until(get('load-empty-start'), 'spinning'),
    'loop-wide-start': () => start(9, 0),
    'loop-wide-end': () => until(get('loop-wide-start'), 'observing'),
    'loop-empty-start': () => start(9, 1, true),
    'loop-empty-end': () => until(get('loop-empty-start'), 'observing'),
    /* release() opens from the grip the checking loop left behind. */
    'release-start': () => {
      const s = get('loop-wide-end');
      s.log = [];
      E.start(s, [
        { type: 'limit', value: E.FACTS.squeezeTorque, text: `claw.control.limits(torque=${E.FACTS.squeezeTorque})` },
        { type: 'move', target: E.FACTS.openTarget, speed: E.FACTS.openSpeed, then: 'COAST', wait: true,
          text: `claw.run_target(\n    speed=${E.FACTS.openSpeed}, target_angle=${E.FACTS.openTarget},\n    then=Stop.COAST\n)` },
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
    'load-loop': cue('stall-wide-start', { stepCode: true }),
    /* From here the loop reads load(), so its reading replaces the stalled() flag. */
    'done-check': cue('load-empty-start', { showLoad: true, hide: ['stalled'] }),
    'release': cue('release-start', { status: 2, showLoad: true, hide: ['stalled'] })
  };
  const views = {
    /* The trailing observation wait only keeps the scene alive for discussion, so
       stage 9 reads the loop as the function will contain it. */
    'load-loop': { show: ['start', 'move', 'startup', 'check', 'poll', 'continue'], console: 'last' },
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
      {title:'The program is waiting for 72°', label:'Explain', state:'default-wide-blocked', focus:'target', stop:null}
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
    /* stalled() waits for the push to reach the full 180 mNm limit and stay there, so
       the jaws sit on the object while the loop keeps checking. load() passes 100 on
       the way up, which is the reason grab() watches it instead. */
    'load-loop': [
      {title:'stalled() ends the waiting, after a pause', label:'Observe',
       focus:'check', stop:'observing'},
      {title:'load() ends it as soon as the jaws press', label:'Observe',
       state:'load-wide-start', showLoad:true, hide:['stalled'], focus:'check', stop:'observing'}
    ],
    /* The 72° close target sits short of the angle where empty jaws would meet, so an empty
       trial finishes its movement with the jaws apart and never builds load. Completion
       is the only ending available, which is why the loop needs done(). */
    'done-check': [
      {title:'The jaws stop, still apart, and the loop keeps checking', label:'Observe',
       caption:'The output reached 72° and stopped. Nothing pushes back, so the load stays low.', stop:'spinning'},
      {title:'claw.done() lets the loop finish', label:'Observe',
       state:'loop-empty-start', status:2, focus:'check',
       caption:'The commanded movement is complete, so done() is True.', stop:'observing'},
      {title:'The loop ended with nothing between the jaws', label:'Explain', focus:'done',
       caption:'The target was reached with nothing to grip. done() is True, and the jaws are still apart.', stop:null}
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
