/* Elaranth civil calendar: source-of-truth rules from HB-TTRPG-tools.
 * 13 months x 28 days, seven weekdays, 364-day year; Saelith = 28-day cycle.
 * Working wedding anchor: Campaign Day 0 = 1 Thawcall 282 S.M.
 * The calendar rules are canon; the wedding's absolute date remains provisional.
 */
(function(root){'use strict';
const MONTH_NAMES=Object.freeze(['Thawcall','Seedwake','Leafrise','Bloomtide','Sunsreach','Haycrest','Deepdelve','Goldgrain','Amberfall','Casktide','Frostgate','Longnight','Hearthwane']);
const WEEKDAYS=Object.freeze(['Crownday','Ledgerday','Rootday','Forgeday','Veilday','Moonday','Hearthday']);
const FESTIVALS=Object.freeze(['Ditchfire Supper','Seed Vault Opening','First Cart','Flowered Sunder','Spear-Moon Muster',"Miners' Fresh Table",'Hammer Sunder','Golden Sunder','Amber Sunder','Casked Moon Feast','White Sunder','Black-Silver Sunder','Thirteenth Sunder']);
const YEAR_DAYS=364,MONTH_DAYS=28;
const WORKING_ANCHOR=Object.freeze({year:282,month:1,day:1,elapsedDay:0,status:'working-wedding-anchor'});
const LUNAR_MARKERS=Object.freeze({1:'Dark Face',7:'First Horn',14:'Bright Sunder (full moon)',21:'Last Horn',28:'Closing Dark'});
function civilFromElapsed(elapsed){
 if(!Number.isSafeInteger(elapsed)||elapsed<0||elapsed>1000000)return null;
 const year=WORKING_ANCHOR.year+Math.floor(elapsed/YEAR_DAYS);
 const ordinal=elapsed%YEAR_DAYS,monthIndex=Math.floor(ordinal/MONTH_DAYS),day=ordinal%MONTH_DAYS+1;
 const weekdayIndex=(day-1)%7;
 const lunar=LUNAR_MARKERS[day]||(day<7?'Waxing crescent':day<14?'Waxing moon':day<21?'Waning gibbous':'Waning moon');
 return Object.freeze({elapsedDay:elapsed,year,month:monthIndex+1,monthName:MONTH_NAMES[monthIndex],
  day,weekday:WEEKDAYS[weekdayIndex],weekdayIndex,week:Math.floor((day-1)/7)+1,
  lunar,dayOfYear:ordinal+1,monthlyObservance:FESTIVALS[monthIndex],
  anchorStatus:WORKING_ANCHOR.status,label:WEEKDAYS[weekdayIndex]+', '+day+' '+MONTH_NAMES[monthIndex]+', '+year+' S.M.'});
}
function elapsedFromCivil(year,month,day){
 if(!Number.isSafeInteger(year)||year<WORKING_ANCHOR.year||!Number.isInteger(month)||month<1||month>13||
 !Number.isInteger(day)||day<1||day>28)return null;
 const n=(year-WORKING_ANCHOR.year)*YEAR_DAYS+(month-1)*MONTH_DAYS+day-1;
 return n<=1000000?n:null;
}
function firstWeekdayAfter(elapsed,weekday){
 if(!Number.isSafeInteger(elapsed)||elapsed<0||!WEEKDAYS.includes(weekday))return null;
 for(let n=elapsed+1;n<=elapsed+7;n++)if(civilFromElapsed(n)?.weekday===weekday)return n;
 return null;
}
function monthsForRange(first,last){
 if(!Number.isInteger(first)||!Number.isInteger(last)||first<1||last>1000||first>last)return [];
 const groups=[];
 for(let m=Math.floor(first/MONTH_DAYS);m<=Math.floor(last/MONTH_DAYS);m++){
  const start=Math.max(first,m*MONTH_DAYS),end=Math.min(last,m*MONTH_DAYS+MONTH_DAYS-1);
  const civil=civilFromElapsed(start);
  groups.push(Object.freeze({index:m,year:civil.year,month:civil.month,name:civil.monthName,
   firstStage:start,lastStage:end,label:civil.monthName+' '+civil.year+' S.M.'}));
 }
 return groups;
}
function weeksForRange(first,last){
 if(!Number.isInteger(first)||!Number.isInteger(last)||first>last)return [];
 const result=[];
 for(let firstDay=first;firstDay<=last;){
  const c=civilFromElapsed(firstDay);
  const weekEnd=firstDay+(7-c.weekdayIndex)-1;
  const end=Math.min(last,weekEnd);
  result.push(Object.freeze({week:c.week,firstStage:firstDay,lastStage:end,
   levels:Object.freeze(Array.from({length:end-firstDay+1},(_,i)=>firstDay+i))}));
  firstDay=end+1;
 }
 return result;
}
const api=Object.freeze({MONTH_NAMES,WEEKDAYS,FESTIVALS,YEAR_DAYS,MONTH_DAYS,WORKING_ANCHOR,LUNAR_MARKERS,
 civilFromElapsed,elapsedFromCivil,firstWeekdayAfter,monthsForRange,weeksForRange});
root.JewelBrookElaranthCalendar=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
