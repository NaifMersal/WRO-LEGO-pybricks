const assert=require('node:assert/strict');
const E=require('./engine.js'), P=require('./checkpoints.js'), A=require('./early-scenes.js');
const s=n=>P.get(n), GRIP=E.FACTS.closeTarget, CONTACT=E.FACTS.contactLoad, SQUEEZE=E.FACTS.squeezeTorque;
assert.equal(E.GEARS.motor.teeth,12);
assert.equal(E.GEARS.right.teeth,20);
assert.equal(E.gearAngles(60).motor,100,'100 motor degrees produce 60 output degrees');
assert.equal(E.gearAngles(60).right,60,'the measured output is the right jaw axle');
assert.equal(E.angle(E.newState({start:60,homed:true})),60,'the reading is the output angle from home');
assert.equal(A.get('home-far-end').reference,'home');
assert.equal(E.angle(A.get('home-far-end')),0,'home defines the open output position as zero');
assert.equal(E.angle(A.get('ready-near-end')),45,'the target is measured from home');
assert.equal(Math.round(E.angle(A.get('grip-wide-end'))),52,'contact displays the output angle');
assert.equal(E.angle(A.get('grip-narrow-end')),60,'the narrower trial reaches its output target');
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
assert.equal(Math.round(E.angle(waited)),25);
assert.equal(waited.contact.some(Boolean),false,'The program must end before the jaws touch the object');
assert.equal(waited.lastTarget,GRIP);
/* load() is the controller's push, filtered and capped: small closing on air,
   negative while closing, never above the torque limit, 0 on coast. */
const closing=E.newState({start:0,homed:true,object:'empty'});
E.start(closing,[{type:'move',target:GRIP,speed:E.FACTS.closeSpeed,then:'HOLD',wait:false},{type:'sleep',ms:5000}]);
E.advance(closing,0.3);
assert.ok(!closing.done && closing.load<0 && Math.abs(closing.load)<CONTACT,'Closing on air reads a small negative load');
E.advance(closing,1.0);
assert.ok(closing.done && Math.abs(closing.load)<CONTACT,'An empty claw at its target builds no load');
for(const torque of [SQUEEZE,90]){
  const pressed=E.newState({start:0,homed:true,object:'wide',torque});
  E.start(pressed,[{type:'move',target:GRIP,speed:E.FACTS.closeSpeed,then:'HOLD',wait:false},{type:'sleep',ms:5000}]);
  let peak=0; for(let i=0;i<600;i++){E.tick(pressed);peak=Math.max(peak,Math.abs(pressed.load));}
  assert.ok(peak<=torque+1e-9 && peak>torque-5,'load() rises to the torque limit and never past it');
  if(torque<CONTACT) assert.ok(peak<CONTACT,'A squeeze torque below CONTACT_LOAD could never end the loop on an object');
}
/* home() still finds zero by stalling at the rigid open stop. */
const homeStall=A.get('home-stall');
assert.ok(homeStall.stalled && homeStall.motor.kind==='home' && homeStall.physical===0,'home() stalls at the open stop');
/* Stage 9 builds the condition one check at a time. stalled() works first, after a pause. */
const stallOnly=s('stall-wide-end');
assert.deepEqual(stallOnly.program.find(p=>p.type==='check').conds,['stalled']);
assert.equal(stallOnly.loopExit,'stalled()');
assert.equal(stallOnly.waiting.kind,'sleep');
assert.equal(stallOnly.program[stallOnly.active].ms,5000);
/* The same loop watching load() leaves while the push is still climbing to the limit. */
const loadOnly=s('load-wide-end');
assert.deepEqual(loadOnly.program.find(p=>p.type==='check').conds,['load']);
assert.equal(loadOnly.loopExit,E.EXIT_LABEL.load);
assert.equal(loadOnly.waiting.kind,'sleep');
assert.ok(loadOnly.lastCheck.load>=CONTACT && loadOnly.lastCheck.load<SQUEEZE,'The loop left on the way up, below the squeeze torque');
assert.ok(!loadOnly.lastCheck.stalled,'stalled() was still False when load() ended the loop');
assert.ok(stallOnly.loopExitTime-loadOnly.loopExitTime>0.25,'The stall-based loop pauses visibly longer on the object');
assert.equal(Math.round(E.angle(loadOnly)),Math.round(E.angle(stallOnly)),'Both loops leave with the jaws on the object');
const squeezing=s('load-wide-end'); E.advance(squeezing,1.0);
assert.ok(squeezing.motor.target===GRIP && Math.abs(squeezing.load)>SQUEEZE-5,'The command keeps squeezing to SQUEEZE_TORQUE after the loop ends');
/* A load-only loop never leaves an empty trial: nothing pushes back. */
const spin=s('load-empty-spin');
assert.deepEqual(spin.program.find(p=>p.type==='check').conds,['load']);
assert.equal(E.angle(spin),GRIP);
assert.equal(spin.motor.target,GRIP);
const spinChecks=spin.checkCount;
E.advance(spin,0.2);
assert.ok(spin.checkCount>spinChecks && spin.loopExit===null,'The load-only loop keeps waiting after the motor settles');
assert.ok(spin.done && Math.abs(spin.load)<CONTACT && spin.loopExit===null,'Only the load is checked, so an empty trial never leaves the loop');
assert.ok(spin.checkCount>60);
assert.equal(spin.log.length,1,'The second message waits behind the loop');
const loop=s('loop-wide-end');
assert.equal(loop.loopExit,E.EXIT_LABEL.load);
assert.equal(loop.waiting.kind,'sleep');
assert.equal(loop.program[loop.active].ms,5000);
assert.equal(loop.program.find(p=>p.type==='check').conds,undefined,'The finished loop checks both');
assert.deepEqual(E.LOOP_CONDS,['load','done']);
const done=s('loop-empty-end');
assert.equal(done.loopExit,'done()');
assert.equal(E.angle(done),GRIP);
assert.equal(done.motor.target,GRIP);
assert.ok(done.lastCheck.done && done.lastCheck.load<CONTACT);
const doneAngle=E.angle(done);
E.advance(done,0.2);
assert.equal(E.angle(done),doneAngle,'The completed motor holds its settled position');
/* Empty jaws stop at the target with a gap still between them: the completed
   movement is the only thing that can end the loop, and nothing was gripped. */
const tips=E.jaws(done.physical);
assert.ok(tips[1].x2-tips[0].x2>0,'Empty jaws finish the movement without meeting');
assert.ok(Math.abs(done.load)<CONTACT,'Nothing blocks empty jaws, so no load builds');
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
assert.equal(open.load,0,'A coasting motor reads no load');
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
console.log('PASS: all checkpoints and phases, default waiting, a program that outruns its motor, a fixed wait that proves nothing, stalled() against load(), both loop conditions, and release.');
