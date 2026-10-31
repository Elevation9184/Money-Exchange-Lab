const fs=require('node:fs'),path=require('node:path'),F=require('../finance-engine');
const config=F.validate({...F.defaults(),savings:[.1,.2,.5,.8,1],ginis:[0,.2,.4,.6],replications:12});
const scenarios={household:config,pure:{...config,initial:0,essentials:0},universal:{...config,universal:1000}};
const rows=[['scenario','saving','income_gini','mean_final_wealth','mean_of_final_medians','mean_final_gini','mean_median_net_saving','unmet_household_month_share','replications','max_accounting_error']];
const highlights={};
for(const [name,c]of Object.entries(scenarios)){
 const all={};for(let r=0;r<c.replications;r++){const world=F.prepare(c,r);for(let i=0;i<c.savings.length;i++)for(let j=0;j<c.ginis.length;j++){const key=i+'_'+j;(all[key]||(all[key]=[])).push(F.simulate(c,i,j,world));}}
 for(const [key,samples]of Object.entries(all)){const [i,j]=key.split('_').map(Number),a=F.aggregate(samples);rows.push([name,c.savings[i],c.ginis[j],a.stats.mean.mean,a.stats.median.mean,a.stats.gini.mean,a.stats.cumulativeSaving.mean,a.stats.unmetShare.mean,samples.length,a.maxAccountingError]);if(c.savings[i]===.2&&c.ginis[j]===.4)highlights[name]={median:a.stats.median.mean,gini:a.stats.gini.mean,unmet:a.stats.unmetShare.mean};}
}
fs.writeFileSync(path.join(__dirname,'../finance-baseline.csv'),rows.map(r=>r.join(',')).join('\n')+'\n');
fs.writeFileSync(path.join(__dirname,'../finance-baseline-assumptions.json'),JSON.stringify(scenarios,null,2)+'\n');console.log(JSON.stringify(highlights));
