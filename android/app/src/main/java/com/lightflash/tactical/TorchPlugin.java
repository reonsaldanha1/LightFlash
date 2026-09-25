package com.lightflash.tactical;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTorch")
public class TorchPlugin extends Plugin {

    private static TorchPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void triggerSosEvent() {
        if (instance != null) {
            JSObject data = new JSObject();
            data.put("mode", "sos");
            instance.notifyListeners("onTriggerSos", data);
        }
    }

    @PluginMethod
    public void checkLaunchIntent(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("triggerSos", MainActivity.pendingSosLaunch);
        MainActivity.pendingSosLaunch = false;
        call.resolve(ret);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        ret.put("supportsStrength", TorchHelper.supportsTorchStrength());
        ret.put("maxStrength", TorchHelper.getMaxTorchStrength());
        ret.put("currentStrength", TorchHelper.getCurrentTorchPercent());
        call.resolve(ret);
    }

    @PluginMethod
    public void setTorch(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        Integer strength = call.getInt("strength", TorchHelper.getCurrentTorchPercent());
        boolean success = TorchHelper.setTorch(getContext(), enabled != null && enabled, strength != null ? strength : 100);

        JSObject ret = new JSObject();
        ret.put("success", success);
        ret.put("isOn", TorchHelper.isTorchOn());
        ret.put("strength", TorchHelper.getCurrentTorchPercent());
        ret.put("maxStrength", TorchHelper.getMaxTorchStrength());
        ret.put("supportsStrength", TorchHelper.supportsTorchStrength());
        call.resolve(ret);
    }

    @PluginMethod
    public void setTorchStrength(PluginCall call) {
        Integer strength = call.getInt("strength", 100);
        boolean success = TorchHelper.setTorchStrength(getContext(), strength != null ? strength : 100);

        JSObject ret = new JSObject();
        ret.put("success", success);
        ret.put("isOn", TorchHelper.isTorchOn());
        ret.put("strength", TorchHelper.getCurrentTorchPercent());
        ret.put("maxStrength", TorchHelper.getMaxTorchStrength());
        ret.put("supportsStrength", TorchHelper.supportsTorchStrength());
        call.resolve(ret);
    }

    @PluginMethod
    public void setScreenBrightness(PluginCall call) {
        Integer brightness = call.getInt("brightness", 100);
        TorchHelper.setScreenBrightness(getActivity(), brightness != null ? brightness : 100);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void toggleTorch(PluginCall call) {
        boolean success = TorchHelper.toggle(getContext());

        JSObject ret = new JSObject();
        ret.put("success", success);
        ret.put("isOn", TorchHelper.isTorchOn());
        ret.put("strength", TorchHelper.getCurrentTorchPercent());
        call.resolve(ret);
    }

    @PluginMethod
    public void getTorchState(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isOn", TorchHelper.isTorchOn());
        ret.put("strength", TorchHelper.getCurrentTorchPercent());
        ret.put("maxLevel", TorchHelper.getMaxTorchStrength());
        ret.put("supportsStrength", TorchHelper.supportsTorchStrength());
        call.resolve(ret);
    }

    @PluginMethod
    public void shareLocation(PluginCall call) {
        String text = call.getString("text", "");
        try {
            Intent sendIntent = new Intent();
            sendIntent.setAction(Intent.ACTION_SEND);
            sendIntent.putExtra(Intent.EXTRA_TEXT, text);
            sendIntent.setType("text/plain");
            Intent shareIntent = Intent.createChooser(sendIntent, "Share Location - Lightflash");
            shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(shareIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not open share chooser: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getNativeLocation(PluginCall call) {
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                Location loc = null;
                if (getContext().checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                    if (loc == null) {
                        loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                    }
                }
                if (loc != null) {
                    JSObject ret = new JSObject();
                    ret.put("latitude", loc.getLatitude());
                    ret.put("longitude", loc.getLongitude());
                    ret.put("altitude", loc.getAltitude());
                    ret.put("accuracy", loc.getAccuracy());
                    call.resolve(ret);
                    return;
                }
            }
        } catch (Exception ignored) {}
        JSObject ret = new JSObject();
        ret.put("latitude", null);
        ret.put("longitude", null);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPinWidget(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AppWidgetManager appWidgetManager = getContext().getSystemService(AppWidgetManager.class);
            ComponentName myProvider = new ComponentName(getContext(), LightflashAppWidget.class);
            if (appWidgetManager != null && appWidgetManager.isRequestPinAppWidgetSupported()) {
                appWidgetManager.requestPinAppWidget(myProvider, null, null);
                JSObject ret = new JSObject();
                ret.put("supported", true);
                ret.put("success", true);
                call.resolve(ret);
                return;
            }
        }
        JSObject ret = new JSObject();
        ret.put("supported", false);
        ret.put("success", false);
        call.resolve(ret);
    }
}
