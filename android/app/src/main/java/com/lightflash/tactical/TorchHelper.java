package com.lightflash.tactical;

import android.content.Context;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.os.Build;
import android.util.Log;

public class TorchHelper {
    private static final String TAG = "TorchHelper";
    private static volatile boolean isTorchOn = false;
    private static String rearCameraId = null;
    private static boolean callbackRegistered = false;

    private static synchronized void ensureInit(Context context) {
        if (context == null) return;
        try {
            final CameraManager cm = (CameraManager) context.getApplicationContext().getSystemService(Context.CAMERA_SERVICE);
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

            if (!callbackRegistered && cm != null) {
                cm.registerTorchCallback(new CameraManager.TorchCallback() {
                    @Override
                    public void onTorchModeChanged(String cameraId, boolean enabled) {
                        super.onTorchModeChanged(cameraId, enabled);
                        if (rearCameraId == null || cameraId.equals(rearCameraId)) {
                            isTorchOn = enabled;
                            Log.d(TAG, "Hardware torch state callback: " + enabled);
                        }
                    }
                }, null);
                callbackRegistered = true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing CameraManager", e);
        }
    }

    public static synchronized boolean setTorch(Context context, boolean enabled) {
        if (context == null) return false;
        ensureInit(context);
        if (rearCameraId == null) {
            Log.w(TAG, "No camera with flash available");
            return false;
        }

        try {
            CameraManager cm = (CameraManager) context.getApplicationContext().getSystemService(Context.CAMERA_SERVICE);
            if (cm != null) {
                cm.setTorchMode(rearCameraId, enabled);
                isTorchOn = enabled;
                Log.d(TAG, "Torch set to: " + enabled);
                return true;
            }
        } catch (CameraAccessException e) {
            Log.e(TAG, "CameraAccessException setting torch: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "General exception setting torch: " + e.getMessage());
        }
        return false;
    }

    public static synchronized boolean toggle(Context context) {
        return setTorch(context, !isTorchOn);
    }

    public static boolean isTorchOn() {
        return isTorchOn;
    }
}
