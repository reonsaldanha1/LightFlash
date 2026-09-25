package com.lightflash.tactical;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

public class LightflashAppWidget extends AppWidgetProvider {

    public static final String ACTION_TOGGLE_TORCH = "com.lightflash.tactical.ACTION_TOGGLE_TORCH";
    public static final String ACTION_OPEN_SOS = "com.lightflash.tactical.ACTION_OPEN_SOS";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        if (context == null || appWidgetManager == null || appWidgetIds == null) return;
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (context == null || intent == null) return;
        String action = intent.getAction();
        if (ACTION_TOGGLE_TORCH.equals(action)) {
            TorchHelper.toggle(context);
            updateAllWidgets(context);
        } else if (ACTION_OPEN_SOS.equals(action)) {
            MainActivity.pendingSosLaunch = true;
            TorchPlugin.triggerSosEvent();
            Intent appIntent = new Intent(context, MainActivity.class);
            appIntent.setAction(Intent.ACTION_VIEW);
            appIntent.putExtra("mode", "sos");
            appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(appIntent);
        }
    }

    public static void updateAllWidgets(Context context) {
        if (context == null) return;
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            if (appWidgetManager == null) return;

            ComponentName thisWidget = new ComponentName(context, LightflashAppWidget.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                for (int appWidgetId : appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, appWidgetId);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        if (context == null || appWidgetManager == null) return;
        try {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.lightflash_app_widget);
            boolean isTorchOn = TorchHelper.isTorchOn();

            if (isTorchOn) {
                views.setViewVisibility(R.id.widget_torch_on_btn, View.VISIBLE);
                views.setViewVisibility(R.id.widget_torch_off_btn, View.GONE);
            } else {
                views.setViewVisibility(R.id.widget_torch_on_btn, View.GONE);
                views.setViewVisibility(R.id.widget_torch_off_btn, View.VISIBLE);
            }

            // PendingIntent for Flashlight Toggle (Direct Hardware Activation)
            Intent toggleIntent = new Intent(context, LightflashAppWidget.class);
            toggleIntent.setAction(ACTION_TOGGLE_TORCH);
            PendingIntent togglePendingIntent = PendingIntent.getBroadcast(
                context,
                100,
                toggleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_torch_off_btn, togglePendingIntent);
            views.setOnClickPendingIntent(R.id.widget_torch_on_btn, togglePendingIntent);

            // PendingIntent for SOS Emergency Beacon (Launches App in SOS Mode)
            Intent sosIntent = new Intent(context, MainActivity.class);
            sosIntent.setAction(Intent.ACTION_VIEW);
            sosIntent.putExtra("mode", "sos");
            sosIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent sosPendingIntent = PendingIntent.getActivity(
                context,
                200,
                sosIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_sos_btn, sosPendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
