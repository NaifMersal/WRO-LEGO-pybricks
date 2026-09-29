/* A deterministic teaching model, not a Pybricks runtime or force estimator. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClawEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Angles and speeds use the 20-tooth output axle, as Motor(..., gears=[12, 20]) does.
  const FACTS = Object.freeze({ port: 'E', direction: 'CLOCKWISE', motorTeeth: 12, outputTeeth: 20,
    openSpeed: 180, closeSpeed: 120, homeTorque: 220, squeezeTorque: 180, contactLoad: 100,
    openTarget: 0, closeTarget: 72 });
  const DT = 0.005, MAX_ANGLE = 105;
  /* The controller's push, in motor mNm, always capped by the torque limit. Closing on
     air costs only gear friction. Blocked, the push climbs fast while the reference is
     still moving away, then slowly: once a run_target reference sits on its target only
     the integral term is left to raise it (run_until_stalled never stops its reference,
     so homing climbs fast all the way). stalled() needs the push at the limit and the
     motor not moving for STALL_TIME, as Pybricks does. Values are illustrative. */
  const FRICTION = 35, PUSH_PLATEAU = 140, FAST_RISE = 1000, SLOW_RISE = 200, STALL_TIME = 0.2;
  /* load() is -pid_average: the push low-pass filtered every 5 ms (avg*0.95 + push*0.05). */
  const LOAD_KEEP = 0.95, LOAD_PERIOD = 0.005;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  // Shared tooth size and tangent pitch circles for all three meshes.
  // Motor -> transfer -> right jaw -> left jaw; every mesh reverses rotation.
  const moduleSize = 70 / FACTS.outputTeeth;
  const motorGear = { x: 320, y: 147, teeth: FACTS.motorTeeth, radius: FACTS.motorTeeth * moduleSize / 2, phase: 0 };
  const rightGear = { x: 355, y: 215, teeth: FACTS.outputTeeth, radius: 35 };
  const leftGear = { x: 285, y: 215, teeth: FACTS.outputTeeth, radius: 35 };
  const distance = Math.hypot(rightGear.x - motorGear.x, rightGear.y - motorGear.y);
  const reach = motorGear.radius * 2, outputReach = motorGear.radius + rightGear.radius;
  const along = (reach ** 2 - outputReach ** 2 + distance ** 2) / (2 * distance);
  const across = Math.sqrt(reach ** 2 - along ** 2);
  const ux = (rightGear.x - motorGear.x) / distance, uy = (rightGear.y - motorGear.y) / distance;
  const transferGear = { x: motorGear.x + along * ux + across * uy,
    y: motorGear.y + along * uy - across * ux, teeth: FACTS.motorTeeth, radius: motorGear.radius };
  function meshPhase(driver, follower) {
    const line = Math.atan2(follower.y - driver.y, follower.x - driver.x) * 180 / Math.PI;
    return line + 180 + driver.teeth / follower.teeth * (line - driver.phase) - 180 / follower.teeth;
  }
  transferGear.phase = meshPhase(motorGear, transferGear);
  rightGear.phase = meshPhase(transferGear, rightGear);
  leftGear.phase = meshPhase(rightGear, leftGear);
  const GEARS = Object.freeze(Object.fromEntries(Object.entries({motor: motorGear, transfer: transferGear,
    right: rightGear, left: leftGear}).map(([key, value]) => [key, Object.freeze(value)])));
  function gearAngles(physical) {
    // physical is the output angle from the open stop; the motor turns 20/12 as far.
    const motor = physical * GEARS.right.teeth / GEARS.motor.teeth;
    const transfer = -motor * GEARS.motor.teeth / GEARS.transfer.teeth;
    const right = -transfer * GEARS.transfer.teeth / GEARS.right.teeth;
    const left = -right * GEARS.right.teeth / GEARS.left.teeth;
    return { motor, transfer, right, left };
  }
  function jaws(a) {
    const r = gearAngles(a).right * Math.PI / 180;
    return [ { x1: 285, y1: 215, x2: 285 - 140 * Math.cos(r), y2: 215 + 140 * Math.sin(r) },
      { x1: 355, y1: 215, x2: 355 + 140 * Math.cos(r), y2: 215 + 140 * Math.sin(r) } ];
  }
  function segmentBox(s, b, padding = 7) {
    let t0 = 0, t1 = 1;
    for (const axis of ['x', 'y']) {
      const start = s[axis + '1'], d = s[axis + '2'] - start;
      const low = b[axis] - b[axis === 'x' ? 'w' : 'h'] / 2 - padding;
      const high = b[axis] + b[axis === 'x' ? 'w' : 'h'] / 2 + padding;
      if (Math.abs(d) < 1e-8) { if (start < low || start > high) return false; }
      else { const a = (low - start) / d, c = (high - start) / d; t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c)); if (t0 > t1) return false; }
    }
    return true;
  }
  function objectFor(size, x = 0, y = 0, width) {
    if (size === 'empty') return null;
    return { size, x: 320 + Number(x), y: 350 + Number(y), w: Number(width || (size === 'narrow' ? 163 : 226)), h: 36 };
  }
  function contacts(angle, object) { return object ? jaws(angle).map(j => segmentBox(j, object)) : [false, false]; }
  function newState(config = {}) {
    return { time: 0, physical: config.start ?? 52.5, offset: config.homed ? 0 : -27.75,
      reference: config.homed ? 'home' : 'unknown', torque: config.torque ?? FACTS.squeezeTorque,
      object: objectFor(config.object ?? 'empty', config.objectX, config.objectY, config.width),
      prop: config.prop ? { x: config.propX ?? 154, y: config.propY ?? 255, w: 34, h: 52 } : null,
      propHit: false, motor: null, stalled: false, done: true, contact: [false, false], effort: 0, pidAverage: 0, load: 0,
      events: [], log: [], program: [], pc: 0, active: -1, waiting: null, running: false, paused: false,
      finished: false, cutOff: false, lastTarget: null, loopExit: null, loopExitTime: null, lastCheck: null, checkCount: 0, gateMessage: '', pauseAtStall: !!config.pauseAtStall };
  }
  const angle = s => s.physical - s.offset;
  function event(s, message) { s.events.push({ time: s.time, message }); if (s.events.length > 80) s.events.shift(); }
  // A coasting motor has no active command, so load() reads 0.
  function coast(s) { s.motor = null; s.stalled = false; s.done = true; s.effort = 0; s.pidAverage = 0; s.load = 0; }
  function command(s, p) {
    const target = p.type === 'homeRun' ? null : p.relative != null ? angle(s) + p.relative : p.target;
    s.motor = { kind: p.type === 'homeRun' ? 'home' : 'target', target,
      speed: Math.abs(p.speed || FACTS.closeSpeed), direction: p.type === 'homeRun' ? -1 : 0,
      then: p.then || 'HOLD', reached: false, saturatedFor: 0, finishNext: false, blockedBy: null };
    s.stalled = false; s.done = false; s.lastTarget = target;
    event(s, p.type === 'homeRun' ? 'Motor: open until stalled' : `Motor: target ${target}° (${p.then || 'HOLD'})`);
  }
  function motorStep(s, dt) {
    const m = s.motor;
    s.contact = contacts(s.physical, s.object);
    if (!m) return;
    if (m.finishNext) { coast(s); event(s, 'Homing operation finished → COAST'); return; }
    const target = m.kind === 'home' ? -1000 : m.target + s.offset;
    const error = target - s.physical;
    if (m.kind !== 'home' && Math.abs(error) < 0.001) {
      if (!m.reached) event(s, 'Target ' + m.target + '° reached → ' + m.then);
      m.reached = true; m.blockedBy = null; s.done = true; s.stalled = false; m.saturatedFor = 0;
      s.effort = 0;   // holding a reached target on air needs no push
      if (m.then === 'COAST') coast(s);
      return;
    }
    m.reached = false; s.done = false;
    const dir = Math.sign(error), speedFactor = s.torque <= 0 ? 0 : Math.min(1, s.torque / 60);
    const step = Math.min(Math.abs(error), m.speed * speedFactor * dt);
    const proposed = clamp(s.physical + dir * step, 0, MAX_ANGLE);
    let next = proposed, blockedBy = null;
    // Only closing into an object obstructs this guided model. Opening releases it.
    if (dir > 0 && contacts(proposed, s.object).some(Boolean)) {
      let lo = s.physical, hi = proposed;
      if (contacts(lo, s.object).some(Boolean)) hi = lo;
      else for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (contacts(mid, s.object).some(Boolean)) hi = mid; else lo = mid; }
      next = hi; blockedBy = 'object';
    }
    if ((dir < 0 && next === 0) || (dir > 0 && next === MAX_ANGLE)) blockedBy = dir < 0 ? 'open stop' : 'closed stop';
    if (speedFactor === 0) blockedBy = 'zero torque limit';
    const moved = Math.abs(next - s.physical);
    s.physical = next; s.contact = contacts(s.physical, s.object);
    if (s.prop && jaws(s.physical).some(j => segmentBox(j, s.prop))) s.propHit = true;
    m.blockedBy = blockedBy;
    const limit = Math.max(0, s.torque);
    if (blockedBy && moved < 0.01) {
      const push = Math.abs(s.effort), plateau = m.kind === 'home' ? limit : Math.min(limit, PUSH_PLATEAU);
      const rose = push < plateau ? Math.min(plateau, push + FAST_RISE * dt) : Math.min(limit, push + SLOW_RISE * dt);
      s.effort = dir * rose;
      m.saturatedFor = rose >= limit - 1e-9 ? m.saturatedFor + dt : 0;
    } else { s.effort = dir * Math.min(limit, FRICTION); m.saturatedFor = 0; s.stalled = false; }
    if (m.saturatedFor >= STALL_TIME && !s.stalled) {
      s.stalled = true; event(s, `Stall detected: ${blockedBy}`);
      if (m.kind === 'home') {
        m.finishNext = true;
        if (s.pauseAtStall) { s.paused = true; s.gateMessage = 'Stall detected at the open stop. Resume to finish the operation and coast.'; }
      }
    }
  }
  function start(s, program) {
    s.program = program; s.pc = 0; s.active = -1; s.waiting = null; s.running = true; s.paused = false; s.finished = false; s.loopExit = null; s.lastCheck = null; s.checkCount = 0;
  }
  function resume(s) {
    if (s.waiting?.kind === 'gate') { s.waiting.action?.(s); s.waiting = null; s.pc++; }
    s.paused = false; s.gateMessage = '';
  }
  /* grab()'s finished loop: leave once the push passes CONTACT_LOAD, or the move is done. */
  const LOOP_CONDS = ['load', 'done'];
  const EXIT_LABEL = { stalled: 'stalled()', done: 'done()', load: `abs(load()) ≥ ${FACTS.contactLoad}` };
  function programStep(s, dt) {
    if (!s.running) return;
    if (s.waiting) {
      const w = s.waiting;
      if (w.kind === 'motor' && !s.done) return;
      if (w.kind === 'sleep') { w.remaining -= dt; if (w.remaining > 0) return; }
      if (w.kind === 'gate') return;
      s.waiting = null; s.pc++;
    }
    // One visible instruction per model tick; the UI can slow model time without changing speeds.
    if (s.pc >= s.program.length) {
      s.running = false; s.finished = true; s.paused = true;
      /* Ending a program releases the motors, as the hub does. Only a task still
         working is visibly cut off; a movement that already reached its target
         keeps the frozen snapshot its slide discusses. */
      s.cutOff = !!s.motor && !s.motor.reached;
      if (s.cutOff) { coast(s); event(s, 'Program ended → motor released before its target'); }
      s.gateMessage = s.cutOff ? 'The program ended while the motor was still working. Ending a program releases the motors.'
        : 'Scene complete. The panels show a frozen final snapshot. Reset for another trial, or send a new command.';
      event(s, 'Scene finished: program and motor time frozen for discussion'); return;
    }
    const p = s.program[s.pc]; s.active = s.pc;
    switch (p.type) {
      case 'limit': s.torque = p.value; s.pc++; break;
      case 'move': case 'homeRun': command(s, p); if (p.wait !== false) s.waiting = { kind: 'motor' }; else s.pc++; break;
      case 'zero': s.offset = s.physical; s.reference = s.physical < 0.01 ? 'home' : 'arbitrary'; event(s, 'Angle reference set to 0°; mechanism did not move'); s.pc++; break;
      case 'sleep': s.waiting = { kind: 'sleep', remaining: p.ms / 1000 }; break;
      case 'print': s.log.push({ time: s.time, text: p.message }); s.pc++; break;
      /* The loop is built one condition at a time, so the op carries the checks it
         makes; the default is the finished pair. */
      case 'check': {
        const load = Math.abs(s.load);
        const reading = { stalled: s.stalled, done: s.done, load: load >= FACTS.contactLoad };
        const exit = (p.conds || LOOP_CONDS).find(name => reading[name]);
        s.lastCheck = { stalled: s.stalled, done: s.done, load }; s.checkCount++;
        if (!exit) s.pc++;
        else { s.loopExit = EXIT_LABEL[exit]; s.loopExitTime = s.time; event(s, `Loop ended: ${s.loopExit}`); s.pc += 3; }
        break;
      }
      case 'jump': s.pc = p.to; break;
      case 'gate': s.waiting = { kind: 'gate', action: p.action }; s.gateMessage = p.message; s.paused = true; break;
      default: s.pc++;
    }
  }
  function filterLoad(s, dt) {
    if (!s.motor) { s.effort = 0; s.pidAverage = 0; s.load = 0; return; }
    const keep = Math.pow(LOAD_KEEP, dt / LOAD_PERIOD);
    s.pidAverage = s.pidAverage * keep + s.effort * (1 - keep);
    s.load = -s.pidAverage;   // negative while closing, as on the hub
  }
  function tick(s, dt = DT) { if (s.paused) return; s.time += dt; motorStep(s, dt); filterLoad(s, dt); if (!s.paused) programStep(s, dt); }
  function advance(s, seconds) { for (let t = 0; t < seconds - 1e-9 && !s.paused; t += DT) tick(s); return s; }
  return { FACTS, DT, MAX_ANGLE, LOOP_CONDS, EXIT_LABEL, GEARS, gearAngles, clamp, jaws, segmentBox, objectFor, contacts, newState, angle, event, coast, command, start, resume, tick, advance };
});
