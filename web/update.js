(function(root){'use strict';
/* Gameplay is always offline. Only the trusted Android bridge checks or downloads releases. */
const RELEASES='https://github.com/mrcalzon02/Rupee-rush/releases';
const desktop=root.RUPEE_DESKTOP_BRIDGE;
const api={
 lastStatus:desktop?'Desktop updates: open GitHub Releases to check and install newer builds manually.':'Signed Android/Fire OS builds check GitHub releases on launch (at most hourly). Download and installation each require your approval.',
 receive(message){api.lastStatus=String(message||'');api.syncStatus();},
 syncStatus(){const node=root.document?.querySelector('[data-update-status]');if(node)node.textContent=api.lastStatus;},
 autoCheck(){if(desktop)return;const bridge=root.RUPEE_UPDATE_BRIDGE;if(bridge&&typeof bridge.checkForUpdatesAutomatically==='function')bridge.checkForUpdatesAutomatically();},
 check(){if(desktop){api.receive('Opening GitHub Releases for manual desktop update checks.');desktop.openReleases();return;}const bridge=root.RUPEE_UPDATE_BRIDGE;if(bridge&&typeof bridge.checkForUpdates==='function'){api.receive('Checking GitHub for newer signed Rupee Rush builds…');bridge.checkForUpdates();}else api.receive('Automatic updates require the signed Android app. Open GitHub Releases to update manually.');},
 openReleases(){if(desktop){desktop.openReleases();return;}const bridge=root.RUPEE_UPDATE_BRIDGE;if(bridge&&typeof bridge.openReleases==='function')bridge.openReleases();else if(typeof root.open==='function')root.open(RELEASES,'_blank','noopener,noreferrer');}
};
root.RupeeUpdates=api;
api.autoCheck();
})(window);
