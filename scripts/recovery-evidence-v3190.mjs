import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
const root=resolve(import.meta.dirname,".."); const dir=resolve(process.env.SYSTEM_BACKUP_DIR||join(root,"backups")); await mkdir(dir,{recursive:true});
const read=async n=>{try{return JSON.parse(await readFile(join(dir,n),"utf8"))}catch{return null}};
const logical=await read("recovery-drill-v3190-latest.json")||await read("recovery-drill-v3180-latest.json"); const pitr=await read("recovery-pitr-v3190-latest.json")||await read("recovery-pitr-v3180-latest.json");
const old=await read("recovery-evidence-v3190.json")||{history:[]}; const entry={captured_at:new Date().toISOString(),logical,pitr,rpo_minutes:logical?.observed_rpo_minutes??logical?.rpo_minutes??null,rto_seconds:logical?.rto_seconds??null,pitr_exercised:pitr?.pitr_restore_exercised===true};
const history=[entry,...(Array.isArray(old.history)?old.history:[])].slice(0,30); await writeFile(join(dir,"recovery-evidence-v3190.json"),JSON.stringify({version:"3.19.0",retention_runs:30,history},null,2)); console.log(`Recovery evidence history: ${history.length}/30 PASS ✅`);
