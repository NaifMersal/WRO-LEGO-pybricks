/* Earlier lesson scenes share the existing motor model and persistent view. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(require('./engine.js'),require('./checkpoints.js'));
  else root.ClawEarly=factory(root.ClawEngine,root.ClawPresentation);
})(typeof globalThis!=='undefined'?globalThis:this,function(E,P){
'use strict';
const F=E.FACTS, baseGet=P.get, recipes={}, cache={};
const copy=P.copy;
const op=(type,text,more={})=>({type,text,...more});
function homeProgram(){return [
 op('limit',`claw.control.limits(\n    torque=${F.homeTorque}\n)`,{value:F.homeTorque,part:'home-limit',home:true}),
 op('homeRun',`claw.run_until_stalled(\n    speed=-${F.closeSpeed},\n    then=Stop.COAST\n)`,{speed:F.closeSpeed,then:'COAST',part:'home-run',home:true}),
 op('sleep','wait(200)',{ms:200,part:'settle',home:true}),
 op('zero','claw.reset_angle(angle=0)',{part:'zero',home:true}),
 op('limit',`claw.control.limits(\n    torque=${F.squeezeTorque}\n)`,{value:F.squeezeTorque,part:'grip-limit',home:true})];}
function start(config,program){const s=E.newState(config);E.start(s,program);return s;}
function home(startAngle=60){return start({start:startAngle,homed:false,object:'empty'},homeProgram());}
function relative(startAngle=60,amount=-15){return start({start:startAngle,homed:false,object:'empty'},[
 op('move',`claw.run_angle(\n    speed=${F.openSpeed}, rotation_angle=${amount}\n)`,{relative:amount,speed:F.openSpeed,then:'HOLD'})]);}
function direction(startAngle=0,closing=true){return start({start:startAngle,homed:false,object:'empty'},[
 op('move','',{relative:(closing?97.5:0)-startAngle,speed:closing?F.closeSpeed:F.openSpeed,then:'COAST'})]);}
function ready(startAngle=0){return start({start:startAngle,homed:true,object:'empty'},[
 op('print','print("Closing to target")',{message:'Closing to target'}),
 op('move',`claw.run_target(\n    speed=${F.closeSpeed}, target_angle=45\n)`,{target:45,speed:F.closeSpeed,then:'HOLD'}),
 op('print','print("Target reached")',{message:'Target reached'})]);}
function grip(size='wide',target=60,speed=F.closeSpeed,torque=F.squeezeTorque){return start({start:0,homed:true,object:size,torque},[
 op('move',`claw.run_target(\n    speed=${speed}, target_angle=${target}\n)`,{target,speed,then:'HOLD'})]);}
Object.assign(P.stops,{
 complete:s=>s.finished,
 outcome:s=>s.stalled||s.finished,
 openStop:s=>s.physical===0&&s.motor?.kind==='home',
 zeroed:s=>s.reference==='home',
 settling:s=>s.active===2&&s.waiting?.kind==='sleep',
 limitSelected:s=>s.active===0,
 gripLimit:s=>s.active===4,
 stallEvent:s=>s.stalled,
});
function at(s,stop){return P.until(s,stop);}
function get(name){if(!(name in recipes))return baseGet(name);if(!cache[name])cache[name]=recipes[name]();return copy(cache[name]);}
P.get=get;
recipes['motion-start']=()=>direction();
recipes['motion-closed']=()=>at(direction(),'complete');
recipes['reverse-start']=()=>direction(97.5,false);
recipes['reverse-open']=()=>at(direction(97.5,false),'complete');
for(const [key,a] of [['near',20],['far',60]]){
 recipes[`relative-${key}-start`]=()=>relative(key==='near'?15:a);
 recipes[`relative-${key}-end`]=()=>at(relative(key==='near'?15:a),'complete');
 recipes[`home-${key}-start`]=()=>home(a);
 recipes[`home-${key}-stop`]=()=>at(home(a),'openStop');
 recipes[`home-${key}-zero`]=()=>at(home(a),'zeroed');
 recipes[`home-${key}-end`]=()=>at(home(a),'complete');
 recipes[`ready-${key}-start`]=()=>ready(key==='near'?0:20);
 recipes[`ready-${key}-end`]=()=>at(ready(key==='near'?0:20),'complete');
}
recipes['arbitrary-start']=()=>start({start:52.5,homed:false},[op('zero','claw.reset_angle(angle=0)')]);
recipes['arbitrary-zero']=()=>at(get('arbitrary-start'),'complete');
recipes['restore-start']=()=>{const s=get('arbitrary-zero');E.start(s,homeProgram());return s;};
recipes['restore-end']=()=>at(get('restore-start'),'complete');
for(const size of ['wide','narrow','empty']){
 recipes[`short-${size}-start`]=()=>grip(size,45);
 recipes[`short-${size}-end`]=()=>at(grip(size,45),'outcome');
 recipes[`grip-${size}-start`]=()=>grip(size,60);
 recipes[`grip-${size}-end`]=()=>at(grip(size,60),'outcome');
 recipes[`close-${size}-start`]=()=>grip(size,F.closeTarget);
 recipes[`close-${size}-end`]=()=>at(grip(size,F.closeTarget),'outcome');
}
recipes['home-limit']=()=>at(home(),'limitSelected');
recipes['home-stall']=()=>at(home(),'stallEvent');
recipes['home-settling']=()=>at(home(),'settling');
recipes['home-zero']=()=>at(home(),'zeroed');
recipes['home-grip-limit']=()=>at(home(),'gripLimit');
const homeFunction=`def home():
    claw.control.limits(torque=${F.homeTorque})
    claw.run_until_stalled(
        speed=-${F.closeSpeed},
        then=Stop.COAST
    )

    wait(200)
    claw.reset_angle(angle=0)

    claw.control.limits(torque=${F.squeezeTorque})`;
const support=`from pybricks.parameters import Stop
from pybricks.tools import wait


`;
const starter=`from pybricks.parameters import Direction, Port, Stop
from pybricks.pupdevices import Motor
from pybricks.tools import wait

claw = Motor(port=Port.${F.port}, positive_direction=Direction.${F.direction}, gears=[${F.motorTeeth}, ${F.outputTeeth}])


${homeFunction}
`;
return {get,recipes,homeProgram,home,relative,direction,ready,grip,homeFunction,copyCode:support+homeFunction+'\n',starter};
});
