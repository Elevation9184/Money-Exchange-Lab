const fs=require('node:fs'),path=require('node:path');
const base=__dirname,read=f=>fs.readFileSync(path.join(base,f),'utf8');
const html=read('shell.html').replace('/*STYLE*/',()=>read('style.css')).replace('/*ENGINE*/',()=>read('engine.js')).replace('/*APP*/',()=>read('app.js')).replace('/*FINANCE_STYLE*/',()=>read('finance.css')).replace('<!--FINANCE_PANEL-->',()=>read('finance-panel.html')).replace('/*FINANCE_ENGINE*/',()=>read('finance-engine.js')).replace('/*FINANCE_APP*/',()=>read('finance-app.js'));
fs.mkdirSync(path.join(base,'dist'),{recursive:true});fs.writeFileSync(path.join(base,'dist/index.html'),html);
for(const file of ['manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','sw.js'])fs.copyFileSync(path.join(base,file),path.join(base,'dist',file));
fs.writeFileSync(path.join(base,'index.html'),html);
console.log('Built self-contained dist/index.html and PWA assets.');
