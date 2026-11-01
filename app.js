(function(){
'use strict';
const E=ExchangeLab, $=id=>document.getElementById(id), money=x=>'$'+Math.round(x).toLocaleString('en-NZ'), pct=x=>(100*x).toFixed(1)+'%', fnum=x=>Math.round(x).toLocaleString('en-NZ');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colour=i=>`hsl(${165-i*10.5} ${43+i*.8}% ${32+i*1.25}%)`;
let config=E.defaults(), economy, running=false, studyRunning=false, history=[], pinned=null, selectedView='ranked', studyResults=[], toastTimer, installPrompt=null;
function notify(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function saveLocal(){try{localStorage.setItem('money-exchange-lab-v1',JSON.stringify(config));}catch(_){}}
function encode(c){const bytes=new TextEncoder().encode(JSON.stringify(c));let s='';bytes.forEach(b=>s+=String.fromCharCode(b));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(s){s=s.replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0))));}
function loadInitial(){try{const hash=location.hash.startsWith('#s=')?decode(location.hash.slice(3)):null;const boot=JSON.parse($('boot-config').textContent);let stored=null;try{stored=localStorage.getItem('money-exchange-lab-v1');}catch(_){}config=E.validate(hash || (boot.groups?boot:null) || (stored?JSON.parse(stored):E.defaults()));}catch(_){config=E.defaults();notify('Could not load saved settings. Defaults restored.');}}
function drawGroups(){
 $('groups').innerHTML=config.groups.map((g,i)=>`<div class="group-row" data-group="${i}"><span class="dot" style="background:${colour(i)}"></span><div class="group-identity"><input type="text" class="group-name" value="${escape(g.name)}" maxlength="40" aria-label="Name of group ${i+1}"><input type="number" class="group-size" value="${g.count}" min="1" max="15000" step="1" aria-label="Number of agents in group ${i+1}"></div><div class="cap-control"><input type="range" class="group-cap" min="10" max="100" step="1" value="${Math.round(g.cap*100)}" aria-label="Spending cap for group ${i+1}"><output>${Math.round(g.cap*100)}%</output></div><button class="remove-group" aria-label="Remove group ${i+1}" ${config.groups.length===1?'disabled':''}>×</button></div>`).join('');
 $('group-count').textContent=config.groups.length+' groups · '+fnum(config.groups.reduce((s,g)=>s+g.count,0))+' agents';
 $('legend').innerHTML=config.groups.map((g,i)=>`<span title="${escape(g.name)}"><i class="dot" style="background:${colour(i)}"></i>${Math.round(g.cap*100)}%</span>`).join('');
 $('add-group').disabled=config.groups.length>=20;
}
function syncControls(){
 $('initial').value=config.initial;$('rounds').value=config.rounds;$('seed').value=config.seed;$('payment-mode').value=config.mode;$('payment').value=Math.min(2000,config.payment);$('payment-exact').value=config.payment;$('scale').value=config.scale;
 $('payment-output').textContent=money(config.payment);$('scale-output').textContent=config.scale.toFixed(1)+'×';$('payment-fields').hidden=config.mode==='scale';$('scale-fields').hidden=config.mode!=='scale';
 const explanations={illustration:'Adds the same amount to each displayed balance after trading. It does not enter the bank or affect the trades. Equal additions reduce Gini while leaving absolute gaps unchanged.',recurring:'Creates an equal payment for everyone before each round. The new money is available to trade. This simple version has no tax funding or inflation.',scale:'Multiplies displayed balances only. A change of monetary scale leaves Gini and money shares unchanged; it is not an income payment.'};
 $('payment-explanation').textContent=explanations[config.mode];
}
function reset(){running=false;economy=E.create(config);history=[{round:0,gini:0}];saveLocal();drawGroups();syncControls();render();}
function setConfig(candidate){try{config=E.validate(candidate);reset();}catch(err){notify(err.message);syncControls();drawGroups();}}
function disableSetup(disabled){document.querySelectorAll('.setup input,.setup select,.setup button,#study-run,#replications').forEach(el=>{el.disabled=disabled;});if(!disabled){$('add-group').disabled=config.groups.length>=20;document.querySelectorAll('.remove-group').forEach(el=>el.disabled=config.groups.length===1);}}
function updateStatus(){
 $('run').textContent=running?'Ⅱ Pause':economy.round>=config.rounds?'↺ Run again':economy.trades?'▶ Continue':'▶ Run experiment';
 $('run').disabled=studyRunning;$('reset').disabled=studyRunning;$('step').disabled=running||studyRunning||economy.round>=config.rounds;
 $('run-status').textContent=studyRunning?'Cap study running…':running?'Money is changing hands…':economy.round>=config.rounds?'Run complete':economy.trades?'Paused · ready to continue':'Ready to trade';
 $('round-label').textContent=fnum(economy.round)+' / '+fnum(config.rounds)+' rounds';$('progress').max=config.rounds;$('progress').value=economy.round;
 $('trade-count').textContent=fnum(economy.trades)+' trades';disableSetup(running||studyRunning);$('study-run').disabled=running;
}
function record(){const gini=E.summarize(economy.balances).gini;if(history.at(-1).round===economy.round)history.at(-1).gini=gini;else history.push({round:economy.round,gini});if(history.length>500)history=[history[0],...history.slice(1).filter((_,i)=>i%2===1)];}
function frame(){if(!running)return;const deadline=performance.now()+12;let rounds=0;do{E.advance(economy,economy.n);rounds++;if(economy.round%Math.max(1,Math.floor(config.rounds/180))===0)record();}while(performance.now()<deadline&&economy.round<config.rounds&&rounds<250);if(economy.round>=config.rounds){running=false;record();}render();if(running)requestAnimationFrame(frame);}
$('run').onclick=()=>{if(studyRunning)return;if(running){running=false;record();render();return;}if(economy.round>=config.rounds)reset();running=true;render();requestAnimationFrame(frame);};
$('reset').onclick=reset;
$('step').onclick=()=>{E.advance(economy,Math.min(50,config.rounds-economy.round)*economy.n);record();render();};
$('restore-defaults').onclick=()=>{config=E.defaults();$('preset').value='mixed';reset();};
$('preset').onchange=()=>{const type=$('preset').value,n=config.groups.reduce((s,g)=>s+g.count,0);let groups;
 if(type==='mixed')groups=E.defaults().groups.map((g,i)=>({...g,count:Math.floor(n/15)+(i<n%15?1:0)})).filter(g=>g.count>0);
 else if(type==='split')groups=[{name:'10% cap',count:Math.floor(n/2),cap:.1},{name:'100% cap',count:Math.ceil(n/2),cap:1}];
 else groups=[{name:'All agents',count:n,cap:{cautious:.1,middle:.5,open:1}[type]}];setConfig({...config,groups});};
$('groups').addEventListener('input',ev=>{if(ev.target.matches('.group-cap'))ev.target.nextElementSibling.textContent=ev.target.value+'%';});
$('groups').addEventListener('change',ev=>{const row=ev.target.closest('[data-group]');if(!row)return;const i=Number(row.dataset.group),groups=config.groups.map(g=>({...g}));if(ev.target.matches('.group-cap'))groups[i].cap=Number(ev.target.value)/100;if(ev.target.matches('.group-size'))groups[i].count=Number(ev.target.value);if(ev.target.matches('.group-name'))groups[i].name=ev.target.value;setConfig({...config,groups});});
$('groups').addEventListener('click',ev=>{if(!ev.target.matches('.remove-group'))return;const i=Number(ev.target.closest('[data-group]').dataset.group);setConfig({...config,groups:config.groups.filter((_,j)=>i!==j)});});
$('add-group').onclick=()=>setConfig({...config,groups:[...config.groups,{name:'Group '+(config.groups.length+1),count:50,cap:.5}]});
for(const id of ['initial','rounds','seed'])$(id).onchange=()=>setConfig({...config,[id]:Number($(id).value)});
$('new-seed').onclick=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);setConfig({...config,seed:a[0]});};
function changePayment(next){try{const checked=E.validate({...config,...next}),needReset=config.mode==='recurring'||checked.mode==='recurring';config=checked;if(needReset)reset();else{economy.config={...config};saveLocal();syncControls();render();}}catch(err){notify(err.message);syncControls();}}
$('payment-mode').onchange=()=>changePayment({mode:$('payment-mode').value});
$('payment').oninput=()=>changePayment({payment:Number($('payment').value)});
$('payment-exact').onchange=()=>changePayment({payment:Number($('payment-exact').value)});
$('scale').oninput=()=>changePayment({scale:Number($('scale').value)});
$('relative').onchange=()=>render();
document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>{selectedView=el.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b===el);b.setAttribute('aria-selected',b===el?'true':'false');});render();});
function chart(id){const canvas=$(id),box=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;canvas.width=Math.max(1,Math.round(box.width*dpr));canvas.height=Math.max(1,Math.round(box.height*dpr));const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.font='10px system-ui';ctx.lineJoin='round';return {ctx,w:box.width,h:box.height};}
function compact(x){if(Math.abs(x)>=1e9)return (x/1e9).toFixed(1)+'b';if(Math.abs(x)>=1e6)return(x/1e6).toFixed(1)+'m';if(Math.abs(x)>=1e3)return(x/1e3).toFixed(x<10000?1:0)+'k';return Math.abs(x)<10?x.toFixed(1):Math.round(x).toString();}
function axes(c,maxY,maxX,xLabel,yLabel,yFormat,xFormat){const {ctx,w,h}=c,p={l:53,r:17,t:25,b:38},W=w-p.l-p.r,H=h-p.t-p.b;ctx.fillStyle='#70807c';ctx.font='9px system-ui';ctx.fillText(yLabel,p.l,11);for(let k=0;k<=4;k++){const y=p.t+H*(1-k/4);ctx.strokeStyle='#e8ede8';ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(p.l+W,y);ctx.stroke();ctx.textAlign='right';ctx.fillText(yFormat(maxY*k/4),p.l-9,y+3);}for(let k=0;k<=4;k++){ctx.textAlign=k===0?'left':k===4?'right':'center';ctx.fillText(xFormat(maxX*k/4),p.l+W*k/4,p.t+H+17);}ctx.textAlign='right';ctx.fillText(xLabel,p.l+W,h-3);ctx.textAlign='left';return {...p,W,H,x:v=>p.l+W*v/maxX,y:v=>p.t+H-H*v/maxY};}
function pathLine(ctx,points,stroke,width=2,dashed=false){if(!points.length)return;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.setLineDash(dashed?[5,4]:[]);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=1;}
function lorenzPoints(stat,a){let sum=0;const points=[[a.x(0),a.y(0)]];for(let i=0;i<stat.n;i++){sum+=stat.sorted[i];points.push([a.x((i+1)/stat.n),a.y(stat.total?sum/stat.total:(i+1)/stat.n)]);}return points;}
function drawMain(values,stat){const c=chart('main-canvas'),ctx=c.ctx,relative=$('relative').checked,divisor=relative?stat.mean:1;
 $('relative').disabled=selectedView==='lorenz';
 const captions={ranked:'Each bar is one agent, ordered from poorest to richest.',histogram:'Share of agents in each balance band. Colours show group membership.',lorenz:'Share of money held by the poorest fraction of agents.'};$('chart-caption').textContent=captions[selectedView];
 $('chart-foot').textContent=selectedView==='lorenz'?'Dashed diagonal: equal shares. Orange: pinned comparison.':selectedView==='histogram'?'Fixed height scale under an illustrative equal addition.':'Colour follows group membership, not wealth rank.';
 if(selectedView==='lorenz'){const a=axes(c,1,1,'Fraction of agents','Share of money',pct,pct);pathLine(ctx,[[a.x(0),a.y(0)],[a.x(1),a.y(1)]],'#b6c4b9',1,true);pathLine(ctx,lorenzPoints(stat,a),'#25695e',2.2);if(pinned)pathLine(ctx,lorenzPoints(pinned.stat,a),'#c37a4c',2,true);return;}
 const pinnedDiv=pinned&&relative?pinned.stat.mean:1;
 if(selectedView==='ranked'){
 const ordered=Array.from(values,(v,i)=>({v:v/divisor,g:economy.groupIds[i]})).sort((a,b)=>a.v-b.v);let maxY=Math.max(1,ordered.at(-1).v);if(pinned)maxY=Math.max(maxY,pinned.stat.sorted.at(-1)/pinnedDiv);maxY*=1.08;
 const a=axes(c,maxY,1,'Agents · poorest → richest',relative?'Balance / mean':'Balance',compact,pct);
 for(let k=0;k<ordered.length;k++){const {v,g}=ordered[k];ctx.fillStyle=colour(g);ctx.fillRect(a.x(k/ordered.length),a.y(v),a.W/ordered.length,a.H*v/maxY);}
 if(pinned)pathLine(ctx,pinned.stat.sorted.map((v,i)=>[a.x((i+.5)/pinned.stat.n),a.y(v/pinnedDiv)]),'#c37a4c',2,true);
 pathLine(ctx,[[a.x(0),a.y(stat.mean/divisor)],[a.x(1),a.y(stat.mean/divisor)]],'#a6b5a8',1,true);
 } else {
 // Base-mean-relative bin width and fixed base peak keep the illustration's vertical scale unchanged.
 const baseMean=E.summarize(economy.balances).mean,scale=config.mode==='scale'?config.scale:1,binWidth=baseMean*scale/6;
 const offset=config.mode==='illustration'?config.payment:0;
 const baseBins=new Map();for(const v of economy.balances){const k=Math.floor(v*scale/binWidth);baseBins.set(k,(baseBins.get(k)||0)+1);}
 let maxY=Math.max(.05,...Array.from(baseBins.values(),n=>n/economy.n))*1.1;
 const bins=new Map();let maxX=(Math.max(...economy.balances)*scale+offset)/divisor;
 for(let i=0;i<economy.n;i++){const k=Math.floor(economy.balances[i]*scale/binWidth);if(!bins.has(k))bins.set(k,new Array(config.groups.length).fill(0));bins.get(k)[economy.groupIds[i]]++;}
 maxX=Math.max((binWidth+offset)/divisor,maxX+binWidth/divisor);if(pinned)maxX=Math.max(maxX,pinned.stat.sorted.at(-1)/pinnedDiv);
 const a=axes(c,maxY,maxX,relative?'Balance / mean':'Balance','Share of agents / band',pct,compact);
 for(const [k,groups]of bins){let accumulated=0;const x=a.x((k*binWidth+offset)/divisor),width=Math.max(.7,a.W*(binWidth/divisor)/maxX-.3);groups.forEach((count,g)=>{if(!count)return;const share=count/economy.n;ctx.fillStyle=colour(g);ctx.fillRect(x,a.y(accumulated+share),width,a.H*share/maxY);accumulated+=share;});}
 if(pinned){const pb=new Map();for(const v of pinned.values){const k=Math.floor((v/pinnedDiv)/(binWidth/divisor));pb.set(k,(pb.get(k)||0)+1);}const points=Array.from(pb,([k,n])=>[a.x((k+.5)*binWidth/divisor),a.y(n/pinned.stat.n)]).sort((a,b)=>a[0]-b[0]);ctx.save();ctx.beginPath();ctx.rect(a.l,a.t,a.W,a.H);ctx.clip();pathLine(ctx,points,'#c37a4c',2,true);ctx.restore();}
 }
}
function drawHistory(){const c=chart('history-canvas'),a=axes(c,1,Math.max(1,config.rounds),'Rounds','Gini',x=>x.toFixed(2),compact);pathLine(c.ctx,history.map(v=>[a.x(v.round),a.y(v.gini)]),'#286c60',2);}
function render(){const values=E.view(economy),stat=E.summarize(values),base=E.summarize(economy.balances),groups=E.groupStats(economy,values);
 $('metric-gini').textContent=stat.gini.toFixed(3);$('base-gini').textContent='Bank balances: '+base.gini.toFixed(3);$('metric-mean').textContent=money(stat.mean);$('median-label').textContent='Median: '+money(stat.median);$('metric-bottom').textContent=pct(stat.bottom20);$('metric-top').textContent=pct(stat.top20);$('population-hero').textContent=fnum(economy.n);$('initial-hero').textContent=money(config.initial);
 $('group-table').innerHTML=groups.map((g,i)=>`<tr><td><span><i class="dot" style="background:${colour(i)}"></i>${escape(g.name)}</span></td><td>${fnum(g.n)}</td><td>${Math.round(g.cap*100)}%</td><td>${money(g.mean)}</td><td>${g.gini.toFixed(3)}</td><td>${pct(g.share)}<span class="money-share"><i style="width:${g.share*100}%;background:${colour(i)}"></i></span></td></tr>`).join('');
 $('bank-total').textContent='Bank money: '+money(base.total);$('injected-total').textContent='New money injected: '+money(economy.injected);const expected=economy.n*config.initial+economy.injected,relativeError=Math.abs(base.total-expected)/expected;$('conservation').textContent=relativeError<1e-10?'Accounting balanced ✓':'Accounting discrepancy';
 $('payment-strip').hidden=(config.mode==='illustration'&&config.payment===0)||(config.mode==='scale'&&config.scale===1)||(config.mode==='recurring'&&config.payment===0);
 $('payment-strip').textContent=config.mode==='illustration'?money(config.payment)+' added per displayed balance · absolute gaps unchanged · Gini '+base.gini.toFixed(3)+' → '+stat.gini.toFixed(3):config.mode==='scale'?'Displayed amounts × '+config.scale.toFixed(1)+' · Gini and money shares unchanged':money(config.payment)+' created per agent per round · '+money(economy.injected)+' injected so far';
 if(pinned){$('comparison').hidden=false;$('comparison').innerHTML=`<span>Orange comparison · Gini <b>${pinned.stat.gini.toFixed(3)}</b> · mean ${money(pinned.stat.mean)} · ${fnum(pinned.round)} rounds</span><button id="clear-pin" aria-label="Clear comparison">×</button>`;$('clear-pin').onclick=()=>{pinned=null;render();};}else $('comparison').hidden=true;
 if(economy.round===0){$('insight-title').textContent='Begin with equality';$('insight-text').textContent='All agents start with the same balance. Run the economy to see the effects of chance and different spending limits.';}
 else if(groups.length>1&&Math.max(...groups.map(g=>g.cap))-Math.min(...groups.map(g=>g.cap))>.01){const low=groups.reduce((a,b)=>a.cap<b.cap?a:b),high=groups.reduce((a,b)=>a.cap>b.cap?a:b);$('insight-title').textContent='Within groups and between groups';$('insight-text').textContent=`The ${Math.round(low.cap*100)}% group has mean ${money(low.mean)}; the ${Math.round(high.cap*100)}% group has mean ${money(high.mean)}. Lower caps restrict outflows while receipt opportunities stay the same. This asymmetry is built into the exchange rule.`;}
 else{$('insight-title').textContent='One rule, many individual outcomes';$('insight-text').textContent=`All groups use ${Math.round(groups[0].cap*100)}% caps. The bank-balance Gini is ${base.gini.toFixed(3)} after ${fnum(economy.round)} rounds. Use the cap study to compare repeated runs rather than relying on one result.`;}
 drawMain(values,stat);drawHistory();updateStatus();
}
$('pin').onclick=()=>{const values=Array.from(E.view(economy));pinned={values,stat:E.summarize(values),round:economy.round};render();notify('Comparison pinned. Change settings and run another economy.');};
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function csvCell(x){let s=String(x);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
$('export').onclick=()=>download('money-exchange-run.json',JSON.stringify({version:E.VERSION,config,completedRounds:economy.round,trades:economy.trades,bankBalances:Array.from(economy.balances),displayedBalances:Array.from(E.view(economy)),history,study:studyResults},null,2),'application/json');
$('csv').onclick=()=>{const v=E.view(economy),rows=[['agent','group','spending_cap','bank_balance','displayed_balance']];for(let i=0;i<economy.n;i++)rows.push([i+1,config.groups[economy.groupIds[i]].name,economy.caps[i],economy.balances[i],v[i]]);download('money-exchange-agents.csv',rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');};
$('import-button').onclick=()=>$('import').click();
$('import').onchange=async()=>{const file=$('import').files[0];if(!file)return;try{if(file.size>10e6)throw Error('Scenario file is too large.');const parsed=JSON.parse(await file.text());const checked=E.validate(parsed.config||parsed);config=checked;reset();notify('Scenario loaded. Run from the saved seed to reproduce it.');}catch(err){notify('Could not load scenario: '+err.message);}$('import').value='';};
$('share').onclick=async()=>{if(location.protocol==='file:'){notify('Scenario links work from a hosted page. Export JSON to share an offline scenario.');return;}const link=location.origin+location.pathname+'#s='+encode(config);try{await navigator.clipboard.writeText(link);notify('Scenario link copied.');}catch(_){notify('Clipboard unavailable. Export JSON to share the settings.');}};
$('download-html').onclick=()=>{const clone=document.documentElement.cloneNode(true);clone.querySelector('#boot-config').textContent=JSON.stringify(config).replace(/</g,'\\u003c');clone.querySelectorAll('link[rel=manifest],link[rel=icon]').forEach(el=>el.remove());clone.setAttribute('data-offline-copy','true');download('Money_Exchange_Lab.html','<!doctype html>\n'+clone.outerHTML,'text/html;charset=utf-8');notify('Offline app saved with the current scenario settings.');};
function drawStudy(){const c=chart('study-canvas'),a=axes(c,.75,1,'Spending cap','Mean Gini',x=>x.toFixed(2),x=>Math.round(x*100)+'%');if(!studyResults.length){c.ctx.fillStyle='#81918a';c.ctx.textAlign='center';c.ctx.font='12px system-ui';c.ctx.fillText('Run a study to calculate the curve',a.l+a.W/2,a.t+a.H/2);c.ctx.textAlign='left';return;}const points=studyResults.map(r=>[a.x(r.cap),a.y(r.mean)]);pathLine(c.ctx,points,'#2b6d61',2);for(const r of studyResults){const x=a.x(r.cap),lo=a.y(r.low),hi=a.y(r.high);pathLine(c.ctx,[[x,lo],[x,hi]],'#8aad9f',1.5);pathLine(c.ctx,[[x-3,lo],[x+3,lo]],'#8aad9f',1);pathLine(c.ctx,[[x-3,hi],[x+3,hi]],'#8aad9f',1);c.ctx.fillStyle='#2b6d61';c.ctx.beginPath();c.ctx.arc(x,a.y(r.mean),3,0,Math.PI*2);c.ctx.fill();}$('study-table').innerHTML=studyResults.map(r=>`<span>${Math.round(r.cap*100)}% cap <b>${r.mean.toFixed(3)}</b></span>`).join('');}
const yieldUI=()=>new Promise(resolve=>setTimeout(resolve,0));
$('study-run').onclick=async()=>{
 if(studyRunning){studyRunning=false;return;}
 const replications=Number($('replications').value);if(!Number.isInteger(replications)||replications<2||replications>100){notify('Use 2 to 100 replications.');return;}
 running=false;studyRunning=true;studyResults=[];$('study-table').innerHTML='';$('study-downloads').hidden=true;updateStatus();$('study-run').disabled=false;$('study-run').textContent='Stop study';const n=economy.n,studyConfig={...config,mode:'illustration',payment:0,scale:1};let cancelled=false;
 try{outer:for(let ci=1;ci<=10;ci++){
 const samples=[];
 for(let rep=0;rep<replications;rep++){
 if(!studyRunning){cancelled=true;break outer;}
 const seed=(config.seed+Math.imul(rep+1,0x9e3779b9))>>>0,e=E.create({...studyConfig,seed,groups:[{name:'All agents',count:n,cap:ci/10}]});
 while(e.round<e.config.rounds){const deadline=performance.now()+10;do{E.advance(e,Math.min(10000,n*e.config.rounds));}while(performance.now()<deadline&&e.round<e.config.rounds);$('study-status').textContent=`${ci*10}% cap · replication ${rep+1}/${replications} · ${Math.round(100*e.trades/(n*e.config.rounds))}% of run`;await yieldUI();if(!studyRunning){cancelled=true;break outer;}}
 samples.push(E.summarize(e.balances).gini);
 }
 studyResults.push({cap:ci/10,...E.compareMeans(samples),samples,agents:n,rounds:config.rounds,initial:config.initial,baseSeed:config.seed});drawStudy();
 }
 }catch(err){cancelled=true;notify('Study stopped: '+err.message);}
 studyRunning=false;$('study-run').textContent='Run cap study';updateStatus();$('study-status').textContent=cancelled?'Study stopped. Completed caps are retained.':`Complete · ${replications} runs per cap · ${fnum(n)} agents · ${fnum(config.rounds)} rounds. Bars: approximate 95% Monte Carlo confidence intervals for the mean, not the spread of individual outcomes.`;$('study-downloads').hidden=!studyResults.length;
};
$('study-csv').onclick=()=>{const rows=[['cap','mean_gini','sd','se','lower_95_mc','upper_95_mc','replications','agents','rounds','initial','base_seed','replication_ginis']];for(const r of studyResults)rows.push([r.cap,r.mean,r.sd,r.se,r.low,r.high,r.n,r.agents,r.rounds,r.initial,r.baseSeed,r.samples.join(';')]);download('money-exchange-cap-study.csv',rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');};
window.addEventListener('resize',()=>{render();drawStudy();});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('install').hidden=false;});
$('install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('install').hidden=true;}};
if('serviceWorker'in navigator&&location.protocol!=='file:'&&!document.documentElement.hasAttribute('data-offline-copy'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
loadInitial();reset();drawStudy();
})();
