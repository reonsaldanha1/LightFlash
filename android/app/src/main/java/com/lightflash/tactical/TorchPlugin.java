package com.lightflash.tactical;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTorch")
public class TorchPlugin extends Plugin {

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
        ret.put("maxStrength", TorchHelper.getMaxTorchStrength());
        ret.put("supportsStrength", TorchHelper.supportsTorchStrength());
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
