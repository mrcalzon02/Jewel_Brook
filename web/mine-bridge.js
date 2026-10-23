/* Pure earned-resource exchange: mining directly supports the match-three campaign. */
(function(root){'use strict';
const OFFERS=Object.freeze({
 moves:{label:'Five extra moves',cost:180,kind:'moves',amount:5,icon:'extra'},
 life:{label:'One extra life',cost:220,kind:'hearts',amount:1,icon:'heart'},
 hammer:{label:'Hammer booster',cost:260,kind:'booster',amount:1,icon:'hammer'},
 rupees:{label:'300 Rupees',cost:340,kind:'coins',amount:300,icon:'rupee'},
 stargems:{label:'Three Star Gems',cost:1100,kind:'gems',amount:3,icon:'crystal'}
});
function buy(save,id,M,P,D,at=Date.now()){
 const offer=OFFERS[id];if(!offer)return {valid:false,reason:'unknown'};
 if(!M||!P||!D)return {valid:false,reason:'dependencies'};
 const n=M.ensure(save,at),wallet=save.rupeeMine;
 if(offer.kind==='hearts'&&save.hearts>=5)return {valid:false,reason:'full'};
 if(offer.kind==='booster'&&!P.unlocked(save,'hammer'))return {valid:false,reason:'locked'};
 if(offer.kind==='booster'&&P.count(save,'hammer')>=999999)return {valid:false,reason:'limit'};
 if(offer.kind==='moves'&&D.ensure(save,at).remaining>999999-offer.amount)return {valid:false,reason:'limit'};
 const current=Number(save[offer.kind]),gains=offer.kind==='coins'||offer.kind==='gems';
 if(gains&&(!Number.isSafeInteger(current)||current<0||current>999999999-offer.amount))return {valid:false,reason:'limit'};
 if(!Number.isSafeInteger(wallet.dollars)||wallet.dollars<offer.cost)return {valid:false,reason:'funds'};
 // All checks precede the debit; each exchange is exactly one deterministic grant.
 wallet.dollars-=offer.cost;
 if(offer.kind==='moves')D.topUp(save,offer.amount,at);
 else if(offer.kind==='hearts')save.hearts=Math.min(5,Math.max(0,Math.trunc(Number(save.hearts)||0))+1);
 else if(offer.kind==='booster')P.grant(save,{hammer:1});
 else save[offer.kind]+=offer.amount;
 return {valid:true,cost:offer.cost,kind:offer.kind,amount:offer.amount,balance:wallet.dollars};
}
const api=Object.freeze({OFFERS,buy});root.RupeeMineBridge=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);