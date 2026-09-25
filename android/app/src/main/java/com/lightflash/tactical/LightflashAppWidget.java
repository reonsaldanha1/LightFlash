package com.lightflash.tactical;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class LightflashAppWidget extends AppWidgetProvider {

    public static final String ACTION_TOGGLE_TORCH = "com.lightflash.tactical.ACTION_TOGGLE_TORCH";
    public static final String ACTION_OPEN_SOS = "com.lightflash.tactical.ACTION_OPEN_SOS";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();
        if (ACTION_TOGGLE_TORCH.equals(action)) {
            TorchHelper.toggle(context);
            updateAllWidgets(context);
        } else if (ACTION_OPEN_SOS.equals(action)) {
            Intent appIntent = new Intent(context, MainActivity.class);
            appIntent.putExtra("mode", "sos");
            appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(appIntent);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName thisWidget = new ComponentName(context, LightflashAppWidget.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.lightflash_app_widget);
        boolean isTorchOn = TorchHelper.isTorchOn();

        if (isTorchOn) {
            views.setInt(R.id.widget_torch_btn, "setBackgroundResource", R.drawable.widget_btn_torch_on);
            views.setTextViewText(R.id.widget_torch_status, "LIGHT ON");
            views.setTextColor(R.id.widget_torch_status, 0xFF000000);
            views.setTextColor(R.id.widget_torch_label, 0xFF000000);
        } else {
            views.setInt(R.id.widget_torch_btn, "setBackgroundResource", R.drawable.widget_btn_bg);
            views.setTextViewText(R.id.widget_torch_status, "OFF");
            views.setTextColor(R.id.widget_torch_status, 0xFF94A3B8);
            views.setTextColor(R.id.widget_torch_label, 0xFFFFFFFF);
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
        views.setOnClickPendingIntent(R.id.widget_torch_btn, togglePendingIntent);

        // PendingIntent for SOS Emergency Beacon (Launches App in SOS Mode)
        Intent sosIntent = new Intent(context, MainActivity.class);
        sosIntent.setAction(Intent.ACTION_VIEW);
        sosIntent.putExtra("mode", "sos");
        sosIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent sosPendingIntent = PendingIntent.getActivity(
            context,
            200,
            sosIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_sos_btn, sosPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
