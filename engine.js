/* Money Exchange Lab — deterministic, dependency-free simulation engine. */
(function(root) {
  'use strict';
  const VERSION = '1.0.0';
  function validate(raw) {
    if (!raw || !Array.isArray(raw.groups) || raw.groups.length < 1 || raw.groups.length > 20) throw Error('Use between 1 and 20 groups.');
    const groups = raw.groups.map((g, i) => {
      const count = Number(g.count), cap = Number(g.cap);
      if (!Number.isInteger(count) || count < 1 || count > 15000) throw Error('Group sizes must be whole numbers from 1 to 15,000.');
      if (!Number.isFinite(cap) || cap < .1 || cap > 1) throw Error('Spend caps must be between 10% and 100%.');
      return {name: String(g.name || ('Group ' + (i + 1))).slice(0, 40), count, cap};
    });
    const n = groups.reduce((s, g) => s + g.count, 0);
    if (n < 2 || n > 15000) throw Error('Use between 2 and 15,000 agents in total.');
    const initial = Number(raw.initial), rounds = Number(raw.rounds), payment = Number(raw.payment || 0), scale = Number(raw.scale || 1);
    if (!Number.isFinite(initial) || initial < 1 || initial > 1e9) throw Error('Starting balance must be from 1 to 1 billion.');
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 10000) throw Error('Run length must be 1 to 10,000 rounds.');
    if (!Number.isFinite(payment) || payment < 0 || payment > 1e7) throw Error('Payment must be from 0 to 10 million.');
    if (!Number.isFinite(scale) || scale < .1 || scale > 100) throw Error('Display multiplier must be from 0.1 to 100.');
    const seed = Number(raw.seed);
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw Error('Seed must be a whole number from 0 to 4,294,967,295.');
    return {groups, initial, rounds, seed: seed >>> 0, payment, scale,
      mode: ['illustration','recurring','scale'].includes(raw.mode) ? raw.mode : 'illustration'};
  }
  function defaults() {
    return {groups: Array.from({length:15}, (_,i)=>({name:'Group '+(i+1),count:50,cap:Math.round((.1+.9*i/14)*100)/100})), initial:1000, rounds:1200, seed:20261101, mode:'illustration',payment:0,scale:1};
  }
  function rng(seed) {
    let state = seed >>> 0;
    return {next() {state = (state + 0x6D2B79F5) >>> 0; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296;}, get state(){return state;}};
  }
  function create(raw) {
    const config = validate(raw), n = config.groups.reduce((s,g)=>s+g.count,0);
    const balances = new Float64Array(n), caps = new Float64Array(n), groupIds = new Uint8Array(n);
    balances.fill(config.initial);
    let k = 0;
    config.groups.forEach((g,gi)=>{for(let j=0;j<g.count;j++,k++){caps[k]=g.cap;groupIds[k]=gi;}});
    return {config,n,balances,caps,groupIds,random:rng(config.seed),round:0,tradeInRound:0,trades:0,injected:0};
  }
  function advance(e, requested) {
    let done = 0;
    while(done < requested && e.round < e.config.rounds) {
      // Each round contains N directed pairwise transfers: one payment per agent on average.
      if(e.tradeInRound === 0 && e.config.mode === 'recurring' && e.config.payment > 0) {
        for(let k=0;k<e.n;k++) e.balances[k] += e.config.payment;
        e.injected += e.n * e.config.payment;
      }
      const i = Math.floor(e.random.next() * e.n);
      let j = Math.floor(e.random.next() * (e.n-1));
      if(j >= i) j++;
      const amount = e.random.next() * e.caps[i] * e.balances[i];
      e.balances[i] -= amount;
      e.balances[j] += amount;
      e.trades++; done++; e.tradeInRound++;
      if(e.tradeInRound === e.n) {e.round++;e.tradeInRound=0;}
    }
    return done;
  }
  function view(e, override) {
    const c=override || e.config;
    const add = c.mode === 'illustration' ? c.payment : 0;
    const factor = c.mode === 'scale' ? c.scale : 1;
    return Float64Array.from(e.balances, x=>(x+add)*factor);
  }
  function summarize(input) {
    const sorted=Array.from(input).sort((a,b)=>a-b), n=sorted.length;
    if(!n)return {n:0,total:0,mean:0,median:0,gini:0,bottom20:0,top20:0,sorted:[]};
    let total=0,weighted=0;
    for(let i=0;i<n;i++){total+=sorted[i];weighted+=(i+1)*sorted[i];}
    function lowerShare(q) {
      const boundary=n*q, whole=Math.floor(boundary), fraction=boundary-whole;
      let amount=0;for(let i=0;i<whole;i++)amount+=sorted[i];
      if(whole<n)amount+=fraction*sorted[whole];
      return total>0 ? amount/total : 0;
    }
    return {n,total,mean:total/n,median:n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2,
      gini:total>0?Math.max(0,Math.min(1,2*weighted/(n*total)-(n+1)/n)):0,
      bottom20:lowerShare(.2),top20:total>0?1-lowerShare(.8):0,sorted};
  }
  function groupStats(e,values) {
    const all=Array.from({length:e.config.groups.length},()=>[]);
    for(let i=0;i<e.n;i++)all[e.groupIds[i]].push(values[i]);
    const total=values.reduce((s,v)=>s+v,0);
    return all.map((v,i)=>({...summarize(v),...e.config.groups[i],share:total? v.reduce((s,x)=>s+x,0)/total:0}));
  }
  function compareMeans(values) {
    const n=values.length,mean=values.reduce((s,x)=>s+x,0)/n;
    const sd=n>1?Math.sqrt(values.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):0;
    return {mean,sd,se:sd/Math.sqrt(n),low:Math.max(0,mean-1.96*sd/Math.sqrt(n)),high:Math.min(1,mean+1.96*sd/Math.sqrt(n)),n};
  }
  const api={VERSION,validate,defaults,rng,create,advance,view,summarize,groupStats,compareMeans};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  root.ExchangeLab=api;
})(typeof globalThis!=='undefined'?globalThis:this);
