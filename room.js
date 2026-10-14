(() => {
 const root=document.documentElement,frame=document.querySelector('.frame');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let scale=1;
 // Background and sprites share a width-based, undistorted 16:9 plane.
 function fit(){
  scale=innerWidth>700?document.documentElement.clientWidth/1920:1;
  root.style.setProperty("--room-height","1080px");
  root.style.setProperty("--room-density",.8);
  root.style.setProperty("--fit-scale",scale);
  const scene=document.querySelector('.scene-entry');
  const width=scene.clientWidth, height=scene.clientHeight;
  const backgroundHeight=width*1080/1920, offset=innerWidth>700?0:height-backgroundHeight;
  const items={robot:[.48413925,.5124506,.097452,.1488644],bot:[.5828766,.5200776,.08334,.1345866],duck:[.7483698,.5478272,.0593646,.1104518]};
  const shadows={robot:[.4833333,.5155556,.1675,.1437037],bot:[.5816667,.5288889,.1541667,.1274074],duck:[.7475,.5644444,.1025,.0933333]};
  function place(selector,r){const el=document.querySelector(selector);if(!el)return;const d=1;const w=r[2]*width*d,h=r[3]*width*1080/1920*d;Object.assign(el.style,{left:(r[0]*width+(r[2]*width-w)/2)+'px',top:(offset+(r[1]+r[3])*backgroundHeight-h)+'px',width:w+'px',height:h+'px'});}
  Object.entries(items).forEach(([id,r])=>place(`[data-toy="${id}"]`,r));
  Object.entries(shadows).forEach(([id,r])=>place(`[data-shadow="${id}"]`,r));
 }
 addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
 new ResizeObserver(fit).observe(document.querySelector('.scene-entry'));fit();
 let px=0,py=0,tx=0,ty=0,parallax=0;
 function camera(){px+=(tx-px)*.065;py+=(ty-py)*.065;root.style.setProperty('--rx',`${-py*1.6}deg`);root.style.setProperty('--ry',`${px*2}deg`);root.style.setProperty('--bg-x',`${-px*5}px`);root.style.setProperty('--bg-y',`${-py*4}px`);if(Math.abs(tx-px)+Math.abs(ty-py)>.002)parallax=requestAnimationFrame(camera);else parallax=0;}
 addEventListener('pointermove',e=>{if(motion.matches||e.pointerType==='touch')return;tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;if(!parallax)parallax=requestAnimationFrame(camera)});
 document.documentElement.addEventListener('pointerleave',()=>{tx=ty=0;if(!parallax)parallax=requestAnimationFrame(camera)});
 document.querySelectorAll('.object:not(.pinned-object)').forEach((object,index)=>{
  let assembly=object.querySelector('.key-assembly');
  const pin=object.querySelector('.pin');
  if(!assembly){assembly=document.createElement('div');Array.from(object.children).filter(c=>c!==pin).forEach(c=>assembly.append(c));object.append(assembly);}
  assembly.classList.add('hanging-assembly');assembly.style.transformOrigin="50% 6px";if(pin){pin.classList.add('fixed-pin');object.append(pin)}
  let angle=0,v=0,lift=0,targetLift=0,drag=null,raf=0,last=0,suppressUntil=0;
  const rest=[0,0,0,0,0,0][index];
  function render(t){const dt=Math.min((t-last)/16.67||1,2);last=t;if(!drag){v+=(-angle*.025)*dt;v*=Math.pow(.965,dt);angle+=v*dt;}lift+=(targetLift-lift)*.16;assembly.style.transform=`rotateZ(${Math.max(-75,Math.min(75,rest+angle))}deg)`;if(drag||Math.abs(angle)>.03||Math.abs(v)>.02||Math.abs(lift-targetLift)>.1){raf=requestAnimationFrame(render)}else{raf=0;last=0}}
  function wake(){if(!raf)raf=requestAnimationFrame(render)}wake();
  object.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=(pin||object).getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,cx:r.left+r.width/2,cy:r.top+r.height/2,moved:false,previous:angle,time:performance.now()};});
  object.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const distance=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);if(distance>7&&!drag.moved){drag.moved=true;object.setPointerCapture(e.pointerId);object.classList.add('is-dragging');targetLift=0;}if(!drag.moved)return;e.preventDefault();const next=Math.max(-63,Math.min(63,-Math.atan2(e.clientX-drag.cx,Math.max(20*scale,e.clientY-drag.cy))*180/Math.PI));const now=performance.now();v=Math.max(-8,Math.min(8,(next-drag.previous)*16.67/Math.max(8,now-drag.time)));angle=next;drag.previous=next;drag.time=now;wake();});
  function release(e){if(!drag||e.pointerId!==drag.id)return;if(drag.moved){suppressUntil=performance.now()+500;if(performance.now()-drag.time>100)v=0;}drag=null;targetLift=0;object.classList.remove('is-dragging');if(object.hasPointerCapture(e.pointerId))object.releasePointerCapture(e.pointerId);if(motion.matches){angle=v=0;}wake();}
  window.addEventListener('pointerup',release);object.addEventListener('pointercancel',release);object.addEventListener('lostpointercapture',release);
  object.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  object.addEventListener('pointerenter',e=>{if(!motion.matches&&e.pointerType!=='touch'&&!drag){v+=.12;wake();}});
  object.querySelectorAll('img,a').forEach(el=>el.draggable=false);
 });

 const tag=new Image();tag.onload=()=>document.querySelector('.keytag').classList.add('generated-tag');tag.src='assets/keytag-3d.png';
document.querySelectorAll('.reference-toy').forEach(toy=>{
 const shadow=document.querySelector(`[data-shadow="${toy.dataset.toy}"]`);
 function animate(kind){if(motion.matches)return;[toy,shadow].filter(Boolean).forEach(el=>{el.classList.remove('hop','wiggle');void el.offsetWidth;el.classList.add(kind)});}
 toy.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')animate('wiggle')});
 toy.addEventListener('click',()=>animate('hop'));
 toy.addEventListener('focus',()=>animate('wiggle'));
 [toy,shadow].filter(Boolean).forEach(el=>el.addEventListener('animationend',()=>el.classList.remove('hop','wiggle')));
 });
})();

