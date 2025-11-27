package com.digitalbalance

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UsageStatsModule"
    }

    @ReactMethod
    fun checkUsagePermission(promise: Promise) {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            reactApplicationContext.packageName
        )
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun requestUsagePermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        val pm = reactApplicationContext.packageManager
        val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        val apps: WritableArray = WritableNativeArray()

        val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
        val time = System.currentTimeMillis()
        // Query stats for last 24 hours
        val stats = usageStatsManager.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, time - 1000 * 60 * 60 * 24, time)
        val usageMap = java.util.HashMap<String, Long>()

        if (stats != null) {
            for (usageStat in stats) {
                val current = usageMap[usageStat.packageName] ?: 0L
                usageMap[usageStat.packageName] = current + usageStat.totalTimeInForeground
            }
        }

        for (appInfo in packages) {
            if (pm.getLaunchIntentForPackage(appInfo.packageName) != null) {
                val appMap: WritableMap = WritableNativeMap()
                appMap.putString("packageName", appInfo.packageName)
                appMap.putString("appName", pm.getApplicationLabel(appInfo).toString())
                
                // Add usage time
                val usageTime = usageMap[appInfo.packageName] ?: 0L
                appMap.putDouble("usageTime", usageTime.toDouble())

                try {
                    val icon = pm.getApplicationIcon(appInfo.packageName)
                    val iconBase64 = getBase64FromDrawable(icon)
                    appMap.putString("icon", iconBase64)
                } catch (e: Exception) {
                    appMap.putString("icon", "")
                }

                apps.pushMap(appMap)
            }
        }
        promise.resolve(apps)
    }

    private fun getBase64FromDrawable(drawable: android.graphics.drawable.Drawable): String {
        val bitmap = if (drawable is android.graphics.drawable.BitmapDrawable) {
            drawable.bitmap
        } else {
            val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 1
            val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 1
            val bitmap = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888)
            val canvas = android.graphics.Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bitmap
        }
        
        // Resize to 64x64 to reduce size
        val resizedBitmap = android.graphics.Bitmap.createScaledBitmap(bitmap, 64, 64, true)
        
        val outputStream = java.io.ByteArrayOutputStream()
        resizedBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 70, outputStream)
        val byteArray = outputStream.toByteArray()
        return android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP)
    }

    @ReactMethod
    fun getTopPackageName(promise: Promise) {
        val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
        val time = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time)
        
        if (stats != null && stats.isNotEmpty()) {
            val sortedStats = stats.sortedByDescending { it.lastTimeUsed }
            promise.resolve(sortedStats[0].packageName)
        } else {
            promise.resolve("")
        }
    }
    @ReactMethod
    fun getWeeklyUsage(packageName: String, promise: Promise) {
        val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
        val calendar = java.util.Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.add(java.util.Calendar.DAY_OF_YEAR, -7)
        val startTime = calendar.timeInMillis

        // We need daily aggregation. 
        // queryUsageStats with INTERVAL_DAILY returns a list of UsageStats, one for each day (roughly).
        val stats = usageStatsManager.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
        
        val weeklyUsage: WritableArray = WritableNativeArray()
        
        // Initialize 7 days with 0
        val dailyUsageMap = java.util.HashMap<String, Long>()
        val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
        
        // Fill map with stats
        if (stats != null) {
            for (usageStat in stats) {
                if (usageStat.packageName == packageName) {
                    val date = dateFormat.format(java.util.Date(usageStat.firstTimeStamp))
                    val current = dailyUsageMap[date] ?: 0L
                    dailyUsageMap[date] = current + usageStat.totalTimeInForeground
                }
            }
        }

        // Create result array for last 7 days
        calendar.timeInMillis = endTime
        calendar.add(java.util.Calendar.DAY_OF_YEAR, -6) // Start from 6 days ago
        
        for (i in 0..6) {
            val date = dateFormat.format(calendar.time)
            val usage = dailyUsageMap[date] ?: 0L
            
            val dayMap: WritableMap = WritableNativeMap()
            dayMap.putString("date", date)
            dayMap.putDouble("usage", usage.toDouble())
            weeklyUsage.pushMap(dayMap)
            
            calendar.add(java.util.Calendar.DAY_OF_YEAR, 1)
        }
        
        promise.resolve(weeklyUsage)
    }
}
