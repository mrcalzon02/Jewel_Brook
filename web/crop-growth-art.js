/* Town crop-growth art resolver: 3 real crops × 5 staged transparent sprites. */
(function(root){'use strict';
 const BASE='art/embryon/town/gardening/growth/';
 const CROPS=Object.freeze(['carrot','wheat','berry']);
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
