/* Heroes of Embryon — Town avatar contract. Static art lookup only; no save-state mutation. */
(function(root){'use strict';
  const FIRST=1,LAST=40,LOCATION='Town',AVATAR='Daysha';
  const BASE='art/embryon/town/';
  const fallback='art/embryon/characters/daysha-approved-key-art.png';
  function boundedLevel(value){
    const n=Number(value);
    return Number.isFinite(n)?Math.max(FIRST,Math.min(LAST,Math.floor(n))):FIRST;
  }
  function avatar(level){
    const n=boundedLevel(level);
    return Object.freeze({location:LOCATION,character:AVATAR,level:n,
      path:BASE+'avatars/daysha_lv_'+String(n).padStart(2,'0')+'.png',
      fallback,
      sheet:BASE+'sheets/daysha_levels_'+String(Math.floor((n-1)/10)*10+1).padStart(2,'0')+'-'+String(Math.ceil(n/10)*10).padStart(2,'0')+'.png'});
  }
  function fromSave(save){return avatar(save&&save.unlocked);}
  const api=Object.freeze({name:LOCATION,firstLevel:FIRST,lastLevel:LAST,avatar,fromSave,boundedLevel});
  root.RupeeTownAvatars=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
