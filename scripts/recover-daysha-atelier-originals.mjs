#!/usr/bin/env node
/**
 * Recover ONLY exact original generated Daysha atelier PNGs from a local folder.
 * Does not publish photos, reference images, or unverified artwork to the game.
 * No dependency on live GitHub/Drive services or image conversion.
 *
 * node scripts/recover-daysha-atelier-originals.mjs --source "/path/to/originals" --verify-only
 * node scripts/recover-daysha-atelier-originals.mjs --source "/path/to/originals" --import
 */
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE = join(ROOT, 'data/daysha-generated-atelier-recovery.json');
const DEST = join(ROOT, 'web/art/embryon/story/gilded-spindle/originals');
const REPORT = join(ROOT, 'web/art/embryon/story/gilded-spindle/imported-originals.json');
const PNG = Buffer.from([137,80,78,71,13,10,26,10]);
const args = process.argv.slice(2);
function option(name) {
 const i=args.indexOf(name);
 return i>=0 ? args[i+1] : undefined;
}
if(args.includes('--help') || !option('--source') || !args.some(a=>a==='--verify-only'||a==='--import')) {
 console.log('Usage: node scripts/recover-daysha-atelier-originals.mjs --source <original-PNG-directory> [--verify-only | --import]');
 process.exitCode=2;
} else {
 const sourceDir=resolve(option('--source'));
 const importing=args.includes('--import');
 const q=JSON.parse(await readFile(QUEUE, 'utf8'));
 if(q.entries?.length!==19) throw Error('Unexpected recovery queue size: refuse to guess file identities.');
 const unique=new Set();
 const valid=[],missing=[],invalid=[];
 for(const entry of q.entries) {
  if(!/^[a-zA-Z0-9_.-]+\.png$/.test(entry.fileName) ||
     !/^[0-9a-f]{64}$/.test(entry.sha256) ||
     unique.has(entry.fileName)) {
   throw Error('Invalid or ambiguous recovery manifest entry: '+entry.fileName);
  }
  unique.add(entry.fileName);
  const file=join(sourceDir,entry.fileName);
  let st;
  try { st=await lstat(file); }
  catch(e) {
   if(e.code==='ENOENT') { missing.push(entry.fileName);continue; }
   throw e;
  }
  if(!st.isFile() || st.size<100 || st.size>30000000) {
   invalid.push(entry.fileName+': not a normal original PNG file');
   continue;
  }
  const bytes=await readFile(file);
  if(!bytes.subarray(0,8).equals(PNG)) {
   invalid.push(entry.fileName+': invalid PNG header');
   continue;
  }
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==entry.sha256) {
   invalid.push(entry.fileName+': SHA-256 mismatch; expected '+entry.sha256+' got '+hash);
   continue;
  }
  valid.push({...entry,bytes:bytes.length,src:file});
 }
 console.log('Generated Daysha originals: '+valid.length+' verified, '+missing.length+' missing, '+invalid.length+' invalid.');
 for(const name of missing) console.log('MISSING '+name);
 for(const issue of invalid) console.error('REJECTED '+issue);
 if(invalid.length) {
  console.error('No files imported: a wrong or corrupted image was supplied.');
  process.exitCode=1;
 } else if(importing && valid.length) {
  // Verify existing destination bytes before writing anything.
  for(const entry of valid) {
   const output=join(DEST,entry.fileName);
   try {
    const old=await readFile(output);
    if(createHash('sha256').update(old).digest('hex')!==entry.sha256)
     throw Error('Destination filename already contains DIFFERENT artwork: '+output);
   } catch(e) { if(e.code!=='ENOENT') throw e; }
  }
  await mkdir(DEST,{recursive:true});
  for(const entry of valid) {
   const output=join(DEST,entry.fileName);
   try { await copyFile(entry.src,output,constants.COPYFILE_EXCL); }
   catch(e) { if(e.code!=='EEXIST') throw e; }
  }
  // Readback is mandatory, including previously staged originals.
  const available=[];
  for(const entry of q.entries) {
   try {
    const bytes=await readFile(join(DEST,entry.fileName));
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(hash!==entry.sha256) throw Error('Staged output hash mismatch: '+entry.fileName);
    available.push({
     id:entry.id,fileName:entry.fileName,eventId:entry.eventId,
     description:entry.description,sha256:hash,
     image:'art/embryon/story/gilded-spindle/originals/'+entry.fileName,
     status:'source_hash_verified_staged',runtimePublished:false
    });
   } catch(e) { if(e.code!=='ENOENT') throw e; }
  }
  await mkdir(dirname(REPORT),{recursive:true});
  await writeFile(REPORT,JSON.stringify({
   version:1,sourceQueue:'data/daysha-generated-atelier-recovery.json',
   status:'verified_generated_originals_staged_not_runtime_published',
   imported:available,missing:q.entries.filter(e=>!available.some(a=>a.id===e.id)).map(e=>e.fileName)
  },null,2)+'\n',{flag:'w'});
  console.log('Staged '+available.length+' exact originals and verified every copied byte.');
  console.log('Runtime publication requires a separate reviewed association of these artworks with story entries.');
 }
 if(!valid.length && !invalid.length) process.exitCode=1;
}
