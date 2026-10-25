/* Town crop-growth art resolver: 48 real crops × 5 staged transparent sprites. */
(function(root){'use strict';
 const BASE='art/embryon/town/gardening/growth/';
 const CROPS=Object.freeze(["carrot","wheat","berry","radish","lettuce","pea","mint","potato","onion","spinach","beet","strawberry","tomato","cabbage","bean","garlic","corn","pepper","broccoli","cucumber","cauliflower","kale","raspberry","sunflower","zucchini","eggplant","pumpkin","barley","rice","cotton","sugarcane","herb-bundle","lavender","tea-leaves","daisy","tulip","rose","coffee-beans","orchid","grape","melon","watermelon","apple","pear","peach","pineapple","dragonfruit","starfruit"]);
 const STAGES=Object.freeze(['seed','sprout','growing','maturing','ready']);
 function image(crop,stage){
  return CROPS.includes(crop)&&STAGES.includes(stage)?BASE+crop+'-'+stage+'.svg':null;
 }
 function fromStatus(status){
  return status&&status.valid!==false?image(status.crop,status.state):null;
 }
 const API=Object.freeze({BASE,CROPS,STAGES,image,fromStatus,status:'isolated-stage-illustration-preview'});
 root.RupeeCropGrowthArt=API;
 if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
