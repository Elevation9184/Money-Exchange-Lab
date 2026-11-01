/* Income × saving: a separate, explicit household accumulation model. */
(function(root){
'use strict';
const VERSION='2.0.0',METRICS=['gini','median','mean','cumulativeSaving','unmetShare','bufferShare','top20'];
function defaults(){return {agents:750,months:360,replications:6,seed:20261101,income:4000,initial:1000,initialGini:0,initialLink:'independent',essentials:2000,universal:0,tax:0,annualReturn:0,volatility:0,incomeGrowth:0,savingSpread:0,savingLink:'independent',savings:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1],ginis:[0,.1,.2,.3,.4,.5,.6]};}
function validate(raw){const c={...defaults(),...raw};
 const ranges={agents:[20,3000,true],months:[1,1200,true],replications:[2,64,true],seed:[0,4294967295,true],income:[1,1e6],initial:[0,1e9],initialGini:[0,.8],essentials:[0,1e6],universal:[0,1e6],tax:[0,.8],annualReturn:[-.2,.3],volatility:[0,.6],incomeGrowth:[-.1,.1],savingSpread:[0,.5]};
 for(const [k,[lo,hi,int]]of Object.entries(ranges)){c[k]=Number(c[k]);if(!Number.isFinite(c[k])||c[k]<lo||c[k]>hi||(int&&!Number.isInteger(c[k])))throw Error(`${k} must be ${int?'a whole number ':''}between ${lo} and ${hi}.`);}
 for(const key of ['savings','ginis']){if(!Array.isArray(c[key])||c[key].length<2||c[key].length>15)throw Error('Each axis needs 2–15 distinct values.');c[key]=c[key].map(Number).sort((a,b)=>a-b);if(c[key].some((v,i)=>!Number.isFinite(v)||v<0||v>(key==='savings'?1:.8)||(i&&v===c[key][i-1])))throw Error('Saving rates must be distinct values from 0–100%; income Ginis from 0–80%.');}
 if(!['independent','aligned','reversed'].includes(c.savingLink)||!['independent','aligned','reversed'].includes(c.initialLink))throw Error('Unknown rank association.');
 const work=c.agents*c.months*c.replications*c.savings.length*c.ginis.length;if(work>1.2e9)throw Error('This grid exceeds 1.2 billion household-months. Reduce the grid, population, duration or replications.');if(c.replications*c.savings.length*c.ginis.length*(Math.ceil(c.months/12)+1)>250000)throw Error('This experiment stores too many trajectories for a phone. Reduce the grid, duration or replications.');return c;
}
function random(seed){let a=seed>>>0,spare=null;function next(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}return {next,normal(){if(spare!==null){const v=spare;spare=null;return v;}const radius=Math.sqrt(-2*Math.log(Math.max(Number.MIN_VALUE,1-next()))),angle=2*Math.PI*next();spare=radius*Math.sin(angle);return radius*Math.cos(angle);}};}
function summary(input){const a=Array.from(input).sort((a,b)=>a-b),n=a.length;let total=0,w=0;for(let i=0;i<n;i++){total+=a[i];w+=(i+1)*a[i];}function quantile(q){const p=(n-1)*q,i=Math.floor(p);return a[i]+(a[Math.min(n-1,i+1)]-a[i])*(p-i);}function share(q){if(!total)return null;let v=0;const b=n*q,k=Math.floor(b);for(let i=0;i<k;i++)v+=a[i];if(k<n)v+=(b-k)*a[k];return v/total;}
 return {total,mean:total/n,median:quantile(.5),p10:quantile(.1),p90:quantile(.9),gini:total>0?Math.max(0,Math.min(1,2*w/(n*total)-(n+1)/n)):null,top20:total>0?1-share(.8):null,bottom20:share(.2),zeroShare:a.filter(x=>x<1e-8).length/n};}
// Calibrate this finite sample to the requested mean AND Gini; no empirical data are fitted.
function distribution(z,mean,target){if(mean===0)return new Float64Array(z.length);if(target===0)return new Float64Array(z.length).fill(mean);const sorted=Array.from(z).sort((a,b)=>a-b),zmax=sorted.at(-1);function inequality(s){let total=0,w=0;for(let i=0;i<sorted.length;i++){const x=Math.exp(s*(sorted[i]-zmax));total+=x;w+=(i+1)*x;}return 2*w/(sorted.length*total)-(sorted.length+1)/sorted.length;}
 let lo=0,hi=1;while(inequality(hi)<target&&hi<128)hi*=2;for(let k=0;k<52;k++){const m=(lo+hi)/2;if(inequality(m)<target)lo=m;else hi=m;}const sigma=(lo+hi)/2,a=Float64Array.from(z,x=>Math.exp(sigma*(x-zmax))),sum=a.reduce((s,x)=>s+x,0),factor=mean*z.length/sum;for(let i=0;i<a.length;i++)a[i]*=factor;return a;}
function prepare(c,rep){const n=c.agents,seed=(c.seed+Math.imul(rep+1,0x9e3779b9))>>>0,incR=random(seed),wealthR=random(seed^0xa8b4d123),saveR=random(seed^0x712325af),returnR=random(seed^0x5e812ccc);
 const z=Float64Array.from({length:n},()=>incR.normal()),zw=Float64Array.from({length:n},()=>wealthR.normal()),perturb=Float64Array.from({length:n},()=>2*saveR.next()-1),rank=Array.from({length:n},(_,i)=>i).sort((i,j)=>z[i]-z[j]);
 const incomes=c.ginis.map(g=>distribution(z,c.income,g));let initial=distribution(zw,c.initial,c.initialGini);
 if(c.initialLink!=='independent'){const ordered=Array.from(initial).sort((a,b)=>a-b),next=new Float64Array(n);rank.forEach((i,k)=>next[i]=ordered[c.initialLink==='aligned'?k:n-1-k]);initial=next;}
 if(c.savingLink!=='independent')rank.forEach((i,k)=>perturb[i]=(c.savingLink==='aligned'?1:-1)*(2*k/(n-1)-1));
 const savings=c.savings.map(s=>Float64Array.from(perturb,p=>Math.max(0,Math.min(1,s+c.savingSpread*p))));
 // One return field per replication, shared by all cells: bounded memory and paired contrasts.
 const factors=c.volatility?new Float64Array(n*c.months):null,mu=(Math.log1p(c.annualReturn)-.5*c.volatility*c.volatility)/12,sd=c.volatility/Math.sqrt(12),constantFactor=Math.exp(mu);
 if(factors)for(let i=0;i<factors.length;i++)factors[i]=Math.exp(mu+sd*returnR.normal());
 return {incomes,savings,initial,factors,constantFactor};
}
function simulate(c,row,col,world){const n=c.agents,wealth=Float64Array.from(world.initial),saved=new Float64Array(n),income=world.incomes[col],rates=world.savings[row],history=[];
 const ledger={initial:wealth.reduce((s,x)=>s+x,0),grossIncome:0,universal:0,tax:0,consumption:0,returns:0,unmet:0,netSaving:0};let failed=0;
 function record(month){history.push({month,...summary(wealth)});}record(0);
 const growth=Math.pow(1+c.incomeGrowth,1/12);let incomeFactor=1;
 for(let t=0;t<c.months;t++){
  for(let i=0;i<n;i++){
   const gain=wealth[i]*((world.factors?world.factors[t*n+i]:world.constantFactor)-1);wealth[i]+=gain;ledger.returns+=gain;
   const gross=income[i]*incomeFactor,tax=gross*c.tax,available=gross-tax+c.universal;
   ledger.grossIncome+=gross;ledger.tax+=tax;ledger.universal+=c.universal;
   if(available>=c.essentials){const contribution=(available-c.essentials)*rates[i];wealth[i]+=contribution;saved[i]+=contribution;ledger.netSaving+=contribution;ledger.consumption+=available-contribution;}
   else{const shortage=c.essentials-available,draw=Math.min(wealth[i],shortage);wealth[i]-=draw;saved[i]-=draw;ledger.netSaving-=draw;ledger.consumption+=available+draw;ledger.unmet+=shortage-draw;if(shortage-draw>1e-7)failed++;}
  }
  incomeFactor*=growth;if((t+1)%12===0||t+1===c.months)record(t+1);
 }
 const final=summary(wealth),savedStat=summary(saved); // signed net contributions: only the median/mean are used.
 const accounting=ledger.initial+ledger.grossIncome+ledger.universal+ledger.returns-ledger.tax-ledger.consumption,err=Math.abs(final.total-accounting)/Math.max(1,Math.abs(final.total),ledger.grossIncome+ledger.universal);
 return {gini:final.gini,median:final.median,mean:final.mean,total:final.total,cumulativeSaving:savedStat.median,unmetShare:failed/(n*c.months),bufferShare:c.essentials?wealth.filter(x=>x<3*c.essentials).length/n:null,top20:final.top20,bottom20:final.bottom20,incomeGini:summary(income).gini,realizedSaving:rates.reduce((s,x)=>s+x,0)/n,ledger,accountingError:err,history};
}
const tValues=[0,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131,2.120,2.110,2.101,2.093,2.086,2.080,2.074,2.069,2.064,2.060,2.056,2.052,2.048,2.045,2.042];
function interval(values){const v=values.filter(Number.isFinite),n=v.length;if(!n)return {n:0,mean:null,sd:null,se:null,low:null,high:null};const mean=v.reduce((s,x)=>s+x,0)/n,sd=n>1?Math.sqrt(v.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):0,se=sd/Math.sqrt(n),crit=n>1?(tValues[n-1]||1.96+2.4/(n-1)):0;return {n,mean,sd,se,low:mean-crit*se,high:mean+crit*se};}
function aggregate(samples){const stats={};for(const key of [...METRICS,'total','bottom20','incomeGini','realizedSaving'])stats[key]=interval(samples.map(s=>s[key]));const history=samples[0].history.map((point,k)=>{const out={month:point.month};for(const key of ['gini','median','p10','p90','mean'])out[key]=interval(samples.map(s=>s.history[k][key])).mean;return out;});const ledger={};for(const key of Object.keys(samples[0].ledger))ledger[key]=interval(samples.map(s=>s.ledger[key])).mean;return {stats,history,ledger,maxAccountingError:Math.max(...samples.map(s=>s.accountingError)),replications:samples.length};}
function paired(a,b,key){return interval(a.map((x,i)=>Number.isFinite(x[key])&&Number.isFinite(b[i]?.[key])?b[i][key]-x[key]:null));}
const api={VERSION,METRICS,defaults,validate,random,summary,distribution,prepare,simulate,interval,aggregate,paired};root.FinancialLab=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
