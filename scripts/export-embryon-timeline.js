#!/usr/bin/env node
'use strict';
/* Regenerate docs/EMBRYON_LEVEL_TIMELINE.csv from actual runtime registries.
 * Main stages 1–1000 are consecutive days shared with the Daysha royal story;
 * never invent full Elaranth dates before verifying month/epoch rules.
 */
const E=require('../web/engine.js');
const Chapters=require('../web/embryon-chapters.js');
const Royal=require('../web/royal-chronicle.js');
const Calendar=require('../web/elaranth-calendar.js');
const Observances=require('../web/elaranth-observances.js');
const HEADERS=['level','campaign_day','chapter_id','chapter','royal_event_ids','royal_event_titles','new_gem','new_tile_overlay','elaranth_full_date','full_date_status','seasonal_week_id','seasonal_week','annual_festival_window','festival_date_precision','full_moon'];
const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
function rows(){
 return Array.from({length:1000},(_,i)=>{
  const day=i+1,chapter=Chapters.forLevel(day);
  if(!chapter)throw Error('Missing campaign chapter for day '+day);
  const events=Royal.eventsOnDay(day),observances=Observances.forDay(day);
  if(!observances?.week)throw Error('Missing Elaranth calendar week on '+day);
  return [day,day,chapter.id,chapter.title,
   events.map(e=>e.id).join('|'),events.map(e=>e.title).join(' | '),
   E.NEW_INTRODUCTIONS.filter(e=>e.level===day).map(e=>e.name).join('|'),
   E.TILE_OVERLAY_UNLOCKS.filter(e=>e.level===day).map(e=>e.kind).join('|'),
   Calendar.civilFromElapsed(day).label,'working-wedding-anchor',
   observances.week.id,observances.week.name,
   observances.festivalWindow?.name||'',observances.festivalWindow?.precision||'',
   observances.fullMoon?.name||''];
 });
}
function csv(){return [HEADERS,...rows()].map(row=>row.map(quote).join(',')).join('\n')+'\n';}
if(require.main===module)process.stdout.write(csv());
module.exports={HEADERS,rows,csv};
