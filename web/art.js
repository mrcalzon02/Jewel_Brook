/* Original, self-contained vector visuals. No Nutbuster image or branding dependency. */
(function(root){'use strict';
const HUES=[355,215,145,42,275,51,191,169,10,290,161,231,175,24,320,46,92,202,65];
const NAMES=['Ruby','Sapphire','Emerald','Topaz','Amethyst','Citrine','Diamond','Moonstone','Garnet','Sunstone','Onyx','Opal','Aquamarine','Jade','Peridot','Turquoise','Lapis','Alexandrite','Tanzanite'];
const icons={
 hammer:'M8 3v3l8 8 3-3 2 2-7 7-2-2 2-2-7-2 2-4-4-2-3 3 3z M4 20l9-9',
 extra:'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18 M12 7v10m-5-5h10',
 row:'M2 12h20 M17 7l5 5-5 5 M7 7l-5 5 5 5',
 column:'M12 2v20 M7 7l5-5 5 5 M7 17l5 5 5-5',
 cross:'M12 2v20 M2 12h20 M7 7l10 10 M17 7L7 17',
 blast:'M12 2l3 7 7-1-5 5 3 7-8-3-6 4 1-8-6-5 8-1z',
 color:'M3 20a11 11 0 0 1 18-12 M5 20a8 8 0 0 1 14-10 M9 20a4 4 0 0 1 8-4',
 shuffle:'M3 8h12l-4-4 M15 8l-4 4 M21 16H9l4-4 M9 16l4 4',
 drill:'M9 2h6l2 5-2 10-3 5-3-5-2-10z M10 8l4 4-4 4',
 unlock:'M5 11V8a7 7 0 0 1 13-3 M5 11h14v11H5z',
 quake:'M3 3h7l-2 7 6 2-4 9 11-13-7-2 3-3',
 'triple-row':'M2 5h20 M2 12h20 M2 19h20',
 'triple-column':'M5 2v20 M12 2v20 M19 2v20',
 starburst:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
 spectrum:'M2 17l4-8 5 8 5-12 6 12',
 frostbreaker:'M12 2v20 M2 12h20 M4 4l16 16 M20 4L4 20',
 pickaxe:'M4 20l11-11 M6 6c6-6 11-5 15 0-6-1-10 1-12 5',
 gloves:'M8 21L4 12V6a2 2 0 0 1 3 0l2 5V3a2 2 0 0 1 3 0v7-5a2 2 0 0 1 3 0v6-4a2 2 0 0 1 3 0v8l-4 6z',
 mine:'M5 19l14-14 M5 5l14 14',
 crystal:'M12 1L3 9l3 12h12l3-12z',
 cart:'M3 4h3l2 11h12l2-8H7 M9 20h1 M18 20h1',
 heart:'M12 21C-7 9 5-2 12 7 19-2 31 9 12 21',
 rupee:'M12 2l8 6v8l-8 6-8-6V8z M7 10h10l-5 8',
 scan:'M11 2a9 9 0 1 0 0 18a9 9 0 0 0 0-18 M18 18l4 4',
 parcel:'M3 7l9-5 9 5v10l-9 5-9-5z M3 7l9 6 9-6 M12 13v9',
 gear:'M12 2v3m0 14v3 M2 12h3m14 0h3 M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2 M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8'
};
const svg=(body,w=64)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+w+'">'+body+'</svg>';
const url=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
function gem(index){
 const h=HUES[((index%HUES.length)+HUES.length)%HUES.length],v=(index%5);
 const top=v===0?'32,4 54,15 60,36 32,60 4,36 10,15':v===1?'32,3 54,9 61,29 49,52 32,61 15,52 3,29 10,9':v===2?'32,2 58,19 58,44 32,62 6,44 6,19':v===3?'32,3 51,15 61,35 32,60 3,35 13,15':'32,3 48,11 60,29 50,49 32,61 14,49 4,29 16,11';
 const inner=v%2?'32,14 46,27 32,51 18,27':'32,14 46,25 43,43 32,51 21,43 18,25';
 return url(svg('<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl('+h+',95%,85%)"/><stop offset=".43" stop-color="hsl('+h+',80%,54%)"/><stop offset="1" stop-color="hsl('+h+',85%,24%)"/></linearGradient></defs><polygon points="'+top+'" fill="url(#g)" stroke="hsl('+h+',85%,85%)" stroke-width="2.5"/><polygon points="'+inner+'" fill="hsl('+h+',95%,74%)" opacity=".6"/><path d="M11 18l21-4 21 4M4 36l28 24 28-24M18 27l14-13 14 13-14 24z" fill="none" stroke="#fff" opacity=".3" stroke-width="2"/>'));
}
function icon(kind,shade='#d2b3ff'){
 const d=icons[kind]||icons.gem||icons.crystal;
 return url(svg('<g transform="translate(9 9) scale(1.92)" fill="none" stroke="'+shade+'" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"><path d="'+d+'"/></g>'));
}
const api=Object.freeze({gem,icon,NAMES});root.RupeeArt=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);