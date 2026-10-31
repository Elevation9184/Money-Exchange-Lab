const fs=require('node:fs'),path=require('node:path'),E=require('../engine.js');
const rows=['cap,replications,agents,rounds,base_seed,mean_gini,sd,se,lower_95_mc,upper_95_mc'];
for(let ci=1;ci<=10;ci++){
 const samples=[];
 for(let r=0;r<24;r++){
  const config={...E.defaults(),groups:[{name:'All',count:750,cap:ci/10}],seed:(20261101+Math.imul(r+1,0x9e3779b9))>>>0};
  const e=E.create(config);E.advance(e,e.n*config.rounds);samples.push(E.summarize(e.balances).gini);
 }
 const stats=E.compareMeans(samples);rows.push([ci/10,24,750,1200,20261101,stats.mean,stats.sd,stats.se,stats.low,stats.high].join(','));
}
const out=path.join(__dirname,'../baseline-results.csv');fs.writeFileSync(out,rows.join('\n')+'\n');console.log(rows.join('\n'));
