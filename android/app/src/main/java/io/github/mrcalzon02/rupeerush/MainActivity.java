package io.github.mrcalzon02.rupeerush;

import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.webkit.JavascriptInterface;
import org.json.JSONObject;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

/**
 * Permanent-package local APK build: offline game assets + stable origin for
 * localStorage saves across signed APK upgrades (but not uninstall/reinstall).
 */
public final class MainActivity extends Activity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String ENTRY = ORIGIN + "/assets/index.html";
    private WebView game;
    private RupeeUpdateService updater;

    private boolean isPackagedAsset(Uri uri) {
        return "https".equals(uri.getScheme())
            && "appassets.androidplatform.net".equals(uri.getHost())
            && uri.getPath() != null
            && uri.getPath().startsWith("/assets/");
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        updater = new RupeeUpdateService(this, this::showUpdateStatus);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        game = new WebView(this);
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        // Music is reassembled from bundled parts asynchronously after the first tap.
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        game.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return isPackagedAsset(uri) ? loader.shouldInterceptRequest(uri) : null;
            }

            @Override public boolean shouldOverrideUrlLoading(
                    WebView view, WebResourceRequest request) {
                return !isPackagedAsset(request.getUrl());
            }
        });
        // Only native Android code accesses the network. Packaged WebView gameplay stays offline.
        game.addJavascriptInterface(new Object() {
            @JavascriptInterface public void checkForUpdates() {
                updater.checkForUpdates();
            }
            @JavascriptInterface public void checkForUpdatesAutomatically() {
                updater.checkForUpdatesAutomatically();
            }
            @JavascriptInterface public void openReleases() {
                runOnUiThread(() -> {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(
                            "https://github.com/mrcalzon02/Jewel_Brook/releases")));
                    } catch (ActivityNotFoundException unavailable) {
                        showUpdateStatus("No browser available to open GitHub Releases.");
                    }
                });
            }
        }, "RUPEE_UPDATE_BRIDGE");
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(game);
        game.loadUrl(ENTRY);
        updater.checkForUpdatesAutomatically();
    }

    private void showUpdateStatus(String message) {
        runOnUiThread(() -> {
            if (game != null) game.evaluateJavascript(
                "window.RupeeUpdates && window.RupeeUpdates.receive(" +
                JSONObject.quote(message) + ")", null);
        });
    }

    @Override public void onBackPressed() {
        if (game != null) {
            // Reuse existing game navigation instead of destroying the save.
            game.evaluateJavascript(
                "(function(){var b=document.querySelector('[data-nav=\"home\"]');" +
                "if(b){b.click();return true;}return false;})()", null);
        } else {
            super.onBackPressed();
        }
    }

    @Override protected void onDestroy() {
        if (updater != null) updater.close();
        if (game != null) {
            game.stopLoading();
            game.destroy();
            game = null;
        }
        super.onDestroy();
    }
}
