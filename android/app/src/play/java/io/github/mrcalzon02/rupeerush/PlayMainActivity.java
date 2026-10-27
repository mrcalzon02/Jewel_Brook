package io.github.mrcalzon02.rupeerush;

import android.webkit.WebView;

/** Play-only launcher: bridge registration precedes the packaged page load. */
public final class PlayMainActivity extends MainActivity {
    @Override protected void prepareGameWebView(WebView game) {
        game.addJavascriptInterface(
            new PlayCloudBridge(this, game), "RupeePlayCloud");
    }
}
