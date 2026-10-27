package io.github.mrcalzon02.rupeerush;

import android.os.Bundle;

/** The only Play launcher; binds cloud controls exclusively to packaged game content. */
public final class PlayMainActivity extends MainActivity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (packagedGameView() != null) {
            packagedGameView().addJavascriptInterface(
                new PlayCloudBridge(this, packagedGameView()), "RupeePlayCloud");
        }
    }
}
