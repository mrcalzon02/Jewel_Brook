/* Rupee Rush Town crop growth art: original painted sprites where present; safe SVG fallback elsewhere. */
(function(root){'use strict';
 const BASE='art/embryon/town/gardening/growth/';
 const CROPS=Object.freeze(["carrot","wheat","berry","radish","lettuce","pea","mint","potato","onion","spinach","beet","strawberry","tomato","cabbage","bean","garlic","corn","pepper","broccoli","cucumber","cauliflower","kale","raspberry","sunflower","zucchini","eggplant","pumpkin","barley","rice","cotton","sugarcane","herb-bundle","lavender","tea-leaves","daisy","tulip","rose","coffee-beans","orchid","grape","melon","watermelon","apple","pear","peach","pineapple","dragonfruit","starfruit"]);
 const STAGES=Object.freeze(['seed','sprout','growing','maturing','ready']);
 const PAINTED=Object.freeze(['carrot','radish','lettuce','pea','mint','potato','onion','strawberry']);
 const has=(crop,stage)=>CROPS.includes(crop)&&STAGES.includes(stage);
 const vector=(crop,stage)=>has(crop,stage)?BASE+crop+'-'+stage+'.svg':null;
 const image=(crop,stage)=>has(crop,stage)?(PAINTED.includes(crop)?BASE+'painted/'+crop+'-'+stage+'.webp':vector(crop,stage)):null;
 const fromStatus=status=>status&&status.valid!==false?image(status.crop,status.state):null;
 const API=Object.freeze({BASE,CROPS,STAGES,PAINTED,image,vector,fromStatus,
  status:'8-crop-painted-stage-art-with-40-crop-vector-fallback'});
 root.RupeeCropGrowthArt=API;
 if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
