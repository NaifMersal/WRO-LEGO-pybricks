const assert=require('node:assert/strict');
const E=require('./engine.js'), P=require('./checkpoints.js');
const s=n=>P.get(n), GRIP=E.FACTS.gripTarget;
const blocked=s('default-wide-blocked');
assert.equal(blocked.waiting.kind,'motor');
assert.deepEqual(blocked.log.map(x=>x.text),['1: Start closing']);
assert.ok(blocked.stalled && !blocked.done && E.angle(blocked)<GRIP);
const empty=s('default-empty-end');
assert.equal(E.angle(empty),GRIP);
assert.equal(empty.log[1].text,'2: Continue');
/* wait=False with nothing after it: the program outruns the motor, and ending it
   releases the drive short of the requested angle. */
const cut=s('cut-end');
assert.equal(cut.log[1].text,'2: Continue');
assert.ok(cut.finished && cut.cutOff && cut.motor===null);
assert.ok(E.angle(cut)<5, 'The program must end before the jaws have moved');
assert.equal(cut.lastTarget,GRIP);
assert.ok(!cut.program.some(p=>p.type==='sleep'), 'This trial has no wait at all');
/* A guessed wait is a guess: 200 ms ends the program short of the object. */
const waited=s('fixed-end');
assert.equal(waited.program.at(-1).ms,200);
assert.deepEqual(waited.log.map(x=>x.text),['1: Start closing','2: Continue']);
assert.ok(waited.finished && waited.cutOff);
assert.equal(Math.round(E.angle(waited)),42);
assert.equal(waited.contact.some(Boolean),false,'The program must end before the jaws touch the object');
assert.equal(waited.lastTarget,GRIP);
/* Stage 9 builds the condition one check at a time. */
const stallOnly=s('stall-wide-end');
assert.deepEqual(stallOnly.program.find(p=>p.type==='check').conds,['stalled']);
assert.equal(stallOnly.loopExit,'stalled()');
assert.equal(stallOnly.waiting.kind,'sleep');
assert.equal(stallOnly.program[stallOnly.active].ms,5000);
const spin=s('stall-empty-spin');
assert.equal(E.angle(spin),GRIP+2);
assert.equal(spin.motor.target,GRIP);
assert.ok(Math.abs(E.angle(spin)-spin.motor.target)<=spin.motor.positionTolerance);
const spinChecks=spin.checkCount;
E.advance(spin,0.2);
assert.ok(spin.checkCount>spinChecks && spin.loopExit===null,'The stalled-only loop keeps waiting after the motor settles');
assert.ok(spin.done && !spin.stalled && spin.loopExit===null,'Only stalled() is checked, so an empty trial never leaves the loop');
assert.ok(spin.checkCount>60);
assert.equal(spin.log.length,1,'The second message waits behind the loop');
const loop=s('loop-wide-end');
assert.equal(loop.loopExit,'stalled()');
assert.equal(loop.waiting.kind,'sleep');
assert.equal(loop.program[loop.active].ms,5000);
assert.equal(loop.program.find(p=>p.type==='check').conds,undefined,'The finished loop checks both');
const done=s('loop-empty-end');
assert.equal(done.loopExit,'done()');
assert.equal(E.angle(done),GRIP+2);
assert.equal(done.motor.target,GRIP);
assert.ok(done.lastCheck.done && !done.lastCheck.stalled);
const doneAngle=E.angle(done);
E.advance(done,0.2);
assert.equal(E.angle(done),doneAngle,'The completed motor holds its settled position');
/* Crossing the requested angle while moving must not finish the command. */
const crossing=s('loop-empty-start');
while(E.angle(crossing)<=GRIP) E.tick(crossing);
assert.ok(!crossing.done && crossing.loopExit===null);
assert.ok(crossing.motor.target===GRIP && E.angle(crossing)<GRIP+2);
assert.ok(!done.object && done.done && !done.stalled,'An empty grab can finish with nothing held');
/* release() opens from the grip the loop left behind, replacing the closing task. */
const opening=s('release-start');
assert.ok(opening.object && opening.contact.every(Boolean),'Opening must start with the object still held');
assert.equal(opening.physical,loop.physical);
const open=s('release-end');
assert.ok(open.object,'The release trial must retain the object');
assert.ok(!open.contact.some(Boolean),'Opening must release both jaws from the object');
assert.equal(E.angle(open),0);
assert.equal(open.motor,null);
assert.equal(open.log[0].text,'Released');
assert.ok(s('loop-wide-end').loopExit,'The release trial must not mutate the saved grip');
const copy=s('loop-wide-end'); copy.physical=0;
assert.notEqual(s('loop-wide-end').physical,0);
for(const name of P.snapshotNames) s(name);
for(const [id,cue] of Object.entries(P.cues)) {
  const state=P.get(cue.state);
  if(cue.stop) P.until(state,cue.stop);
  for(const phase of cue.phases||[]) {
    const from=phase.state?P.get(phase.state):state;
    if(phase.stop) P.until(from,phase.stop);
  }
}
console.log('PASS: all checkpoints and phases, default waiting, a program that outruns its motor, a fixed wait that proves nothing, both loop conditions, and release.');
