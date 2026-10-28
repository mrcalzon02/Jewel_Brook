/* One illustrated Daysha avatar: the equipped full-body outfit is the character.
 * Character-card collectibles are not player portrait substitutes.
 * Lookup only; never creates, grants, or changes a cosmetic or save. */
(function(root){'use strict';
 const Economy=root.RupeeEconomy,Avatars=root.RupeeTownAvatars;
 function fromSave(save){
   const requested=save?.cosmeticEquipped?.outfit;
   const owned=save?.cosmeticsOwned?.[requested]===true;
   const selected=owned&&Economy?.BY_ID?.[requested]?.type==='outfit'
     ?Economy.BY_ID[requested]:null;
   const defaultOutfit=Economy?.BY_ID?.['outfit-01'];
   const item=selected||defaultOutfit;
   const fallback=Avatars?.avatar(1)?.fallback||
     'art/embryon/characters/daysha-approved-key-art.png';
   return Object.freeze({character:'Daysha',
     outfitId:item?.id||null,
     outfitName:item?.name||'Approved Daysha appearance',
     image:item?.image||fallback,
     reference:fallback});
 }
 const API=Object.freeze({fromSave});
 root.RupeeTownCharacter=API;
 if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
