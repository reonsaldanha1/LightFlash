package com.lightflash.tactical;

import android.app.Activity;
import android.content.Context;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.os.Build;
import android.util.Log;
import android.view.WindowManager;

public class TorchHelper {
    private static final String TAG = "TorchHelper";
    private static volatile boolean isTorchOn = false;
    private static String rearCameraId = null;
    private static boolean callbackRegistered = false;
    private static int maxTorchStrength = 1;
    private static int defaultTorchStrength = 1;
    private static int currentTorchPercent = 100;

    private static synchronized void ensureInit(Context context) {
        if (context == null) return;
        try {
            final Context appContext = context.getApplicationContext();
            final CameraManager cm = (CameraManager) appContext.getSystemService(Context.CAMERA_SERVICE);
            if (cm == null) return;

            if (rearCameraId == null) {
                for (String id : cm.getCameraIdList()) {
                    CameraCharacteristics chars = cm.getCameraCharacteristics(id);
                    Boolean flashAvailable = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                    Integer facing = chars.get(CameraCharacteristics.LENS_FACING);
                    if (flashAvailable != null && flashAvailable && facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                        rearCameraId = id;
                        break;
                    }
                }
                if (rearCameraId == null && cm.getCameraIdList().length > 0) {
                    rearCameraId = cm.getCameraIdList()[0];
                }
            }

            if (rearCameraId != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                try {
                    CameraCharacteristics chars = cm.getCameraCharacteristics(rearCameraId);
                    Integer maxLvl = chars.get(CameraCharacteristics.FLASH_INFO_STRENGTH_MAXIMUM_LEVEL);
                    Integer defLvl = chars.get(CameraCharacteristics.FLASH_INFO_STRENGTH_DEFAULT_LEVEL);
                    if (maxLvl != null && maxLvl > 1) {
                        maxTorchStrength = maxLvl;
                        defaultTorchStrength = defLvl != null ? defLvl : 1;
                        Log.d(TAG, "Hardware torch multi-level strength supported: max = " + maxTorchStrength);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Could not read flash strength characteristics: " + e.getMessage());
                }
            }

            if (!callbackRegistered) {
                cm.registerTorchCallback(new CameraManager.TorchCallback() {
                    @Override
                    public void onTorchModeChanged(String cameraId, boolean enabled) {
                        super.onTorchModeChanged(cameraId, enabled);
                        if (rearCameraId == null || cameraId.equals(rearCameraId)) {
                            isTorchOn = enabled;
                            Log.d(TAG, "Hardware torch state callback: " + enabled);
                            try {
                                LightflashAppWidget.updateAllWidgets(appContext);
                            } catch (Exception ignored) {}
                        }
                    }
                }, null);
                callbackRegistered = true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing CameraManager", e);
        }
    }

    public static synchronized boolean setTorch(Context context, boolean enabled, int percent) {
        if (context == null) return false;
        ensureInit(context);
        if (rearCameraId == null) {
            Log.w(TAG, "No camera with flash available");
            return false;
        }

        try {
            CameraManager cm = (CameraManager) context.getApplicationContext().getSystemService(Context.CAMERA_SERVICE);
            if (cm != null) {
                if (!enabled || percent <= 0) {
                    cm.setTorchMode(rearCameraId, false);
                    isTorchOn = false;
                    Log.d(TAG, "Hardware torch turned OFF");
                } else {
                    currentTorchPercent = Math.max(1, Math.min(100, percent));
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && maxTorchStrength > 1) {
                        int strengthLevel = Math.max(1, Math.min(maxTorchStrength, Math.round((currentTorchPercent / 100.0f) * maxTorchStrength)));
                        cm.turnOnTorchWithStrengthLevel(rearCameraId, strengthLevel);
                        Log.d(TAG, "Hardware torch set with strength level " + strengthLevel + "/" + maxTorchStrength + " (" + currentTorchPercent + "%)");
                    } else {
                        cm.setTorchMode(rearCameraId, true);
                        Log.d(TAG, "Hardware torch set to ON (standard mode)");
                    }
                    isTorchOn = true;
                }
                try {
                    LightflashAppWidget.updateAllWidgets(context.getApplicationContext());
                } catch (Exception ignored) {}
                return true;
            }
        } catch (CameraAccessException e) {
            Log.e(TAG, "CameraAccessException setting torch: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "General exception setting torch: " + e.getMessage());
        }
        return false;
    }

    public static synchronized boolean setTorch(Context context, boolean enabled) {
        return setTorch(context, enabled, currentTorchPercent);
    }

    public static synchronized boolean setTorchStrength(Context context, int percent) {
        currentTorchPercent = Math.max(1, Math.min(100, percent));
        if (isTorchOn) {
            return setTorch(context, true, currentTorchPercent);
        }
        return true;
    }

    public static void setScreenBrightness(Activity activity, int percent) {
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            try {
                WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
                if (percent < 0) {
                    lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
                } else {
                    float b = Math.max(0.01f, Math.min(1.0f, percent / 100.0f));
                    lp.screenBrightness = b;
                }
                activity.getWindow().setAttributes(lp);
                Log.d(TAG, "Window screenBrightness set to " + lp.screenBrightness);
            } catch (Exception e) {
                Log.e(TAG, "Error setting screen brightness", e);
            }
        });
    }

    public static synchronized boolean toggle(Context context) {
        return setTorch(context, !isTorchOn, currentTorchPercent);
    }

    public static boolean isTorchOn() {
        return isTorchOn;
    }

    public static int getCurrentTorchPercent() {
        return currentTorchPercent;
    }

    public static int getMaxTorchStrength() {
        return maxTorchStrength;
    }

    public static boolean supportsTorchStrength() {
        return maxTorchStrength > 1;
    }
}
