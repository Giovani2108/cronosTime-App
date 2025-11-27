package com.digitalbalance

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.MotionEvent
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.core.app.NotificationCompat
import java.util.ArrayList

class MonitorService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: FrameLayout? = null
    
    // UI References for updates
    private var iconView: ImageView? = null
    private var titleView: TextView? = null
    private var messageView: TextView? = null
    private var unlockButton: Button? = null
    private var notNowButton: TextView? = null

    private var activeTimers: HashMap<String, View> = HashMap()
    private var activeTimerParams: HashMap<String, WindowManager.LayoutParams> = HashMap()
    private var unlockEndTimes: HashMap<String, Long> = HashMap()
    private var currentBlockedPackage: String? = null
    private var appConfigs: java.util.HashMap<String, org.json.JSONObject> = java.util.HashMap()
    private var lastCheckedPackage: String? = null
    private var floatingTimerParams: WindowManager.LayoutParams? = null

    private val handler = Handler(Looper.getMainLooper())
    private var restrictedApps: ArrayList<String> = ArrayList()
    private var temporarilyUnlockedApps: ArrayList<String> = ArrayList()
    private var isOverlayShowing = false

    private val checkRunnable = object : Runnable {
        override fun run() {
            checkCurrentApp()
            updateFloatingTimers()
            // Check more frequently for snappier response (200ms)
            handler.postDelayed(this, 200)
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private var soundPool: android.media.SoundPool? = null
    private var purchaseSoundId: Int = 0

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(1, createNotification())
        
        // Pre-create views to avoid lag when showing
        createOverlayView()
        // Pre-create views to avoid lag when showing
        createOverlayView()
        
        // Initialize SoundPool
        val audioAttributes = android.media.AudioAttributes.Builder()
            .setUsage(android.media.AudioAttributes.USAGE_GAME)
            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        soundPool = android.media.SoundPool.Builder()
            .setMaxStreams(1)
            .setAudioAttributes(audioAttributes)
            .build()
            
        purchaseSoundId = soundPool?.load(this, R.raw.purchase_success, 1) ?: 0
        
        handler.post(checkRunnable)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            if (intent.hasExtra("restrictedAppsJson")) {
                val jsonStr = intent.getStringExtra("restrictedAppsJson")
                if (jsonStr != null) {
                    try {
                        val json = org.json.JSONObject(jsonStr)
                        restrictedApps.clear()
                        appConfigs.clear()
                        val keys = json.keys()
                        while (keys.hasNext()) {
                            val key = keys.next()
                            restrictedApps.add(key)
                            appConfigs[key] = json.getJSONObject(key)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
            if (intent.action == "STOP_SERVICE") {
                stopSelf()
                return START_NOT_STICKY
            }
        }
        return START_STICKY
    }

    private fun unlockApp() {
        val topPackage = currentBlockedPackage ?: return
        
        if (restrictedApps.contains(topPackage)) {
            val config = appConfigs[topPackage]
            val cost = config?.optInt("cost", 10) ?: 10
            val duration = config?.optLong("duration", 5 * 60 * 1000) ?: (5 * 60 * 1000)

            val prefs = getSharedPreferences("WalletPrefs", Context.MODE_PRIVATE)
            val currentBalance = prefs.getInt("coin_balance", 0)
            
            if (currentBalance >= cost) {
                // Deduct coins
                prefs.edit().putInt("coin_balance", currentBalance - cost).apply()
                
                // Play success sound
                soundPool?.play(purchaseSoundId, 1f, 1f, 1, 0, 1f)

                wasUnlocked = true // Mark as unlocked so we don't count as avoided

                temporarilyUnlockedApps.add(topPackage)
                unlockEndTimes[topPackage] = System.currentTimeMillis() + duration
                
                hideOverlay()
                showFloatingTimer(topPackage)
            } else {
                // Optional: Show "Insufficient funds" toast or shake animation
            }
        }
    }

    // ... (rest of methods)

    private fun playUnlockSound() {
        // Deprecated in favor of SoundPool in unlockApp, but keeping empty or removing usage
    }

    // ...

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(checkRunnable)
        hideOverlay()
        hideAllFloatingTimers()
        soundPool?.release()
        soundPool = null
    }


    private fun createFloatingTimerView(packageName: String): View {
        val layout = android.widget.LinearLayout(this)
        layout.orientation = android.widget.LinearLayout.HORIZONTAL
        layout.gravity = Gravity.CENTER_VERTICAL
        
        val shape = android.graphics.drawable.GradientDrawable()
        shape.shape = android.graphics.drawable.GradientDrawable.RECTANGLE
        shape.cornerRadius = 50f
        shape.setColor(0x80000000.toInt())
        layout.background = shape
        layout.setPadding(20, 10, 30, 10)

        // Icon
        val iconView = ImageView(this)
        try {
            val icon = packageManager.getApplicationIcon(packageName)
            iconView.setImageDrawable(icon)
        } catch (e: Exception) {
            iconView.setImageResource(android.R.drawable.sym_def_app_icon)
        }
        val iconParams = android.widget.LinearLayout.LayoutParams(60, 60)
        iconParams.rightMargin = 15
        layout.addView(iconView, iconParams)
        
        // Timer Text
        val timerText = TextView(this)
        timerText.textSize = 14f
        timerText.setTextColor(0xFFFFFFFF.toInt())
        timerText.typeface = android.graphics.Typeface.DEFAULT_BOLD
        layout.addView(timerText)
        
        layout.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                val params = activeTimerParams[packageName] ?: return false
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        try {
                            windowManager.updateViewLayout(layout, params)
                        } catch (e: Exception) {
                            // View might be removed
                        }
                        return true
                    }
                }
                return false
            }
        })
        
        return layout
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "MonitorServiceChannel",
                "App Monitor Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, "MonitorServiceChannel")
            .setContentTitle("Digital Balance")
            .setContentText("Monitoring app usage...")
            .setSmallIcon(R.mipmap.ic_launcher)
            .build()
    }

    private fun checkCurrentApp() {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        
        // Use queryEvents for more accurate foreground detection
        val events = usageStatsManager.queryEvents(time - 2000, time)
        val event = UsageEvents.Event()
        var topPackage: String? = null
        
        // Find the latest MOVE_TO_FOREGROUND event
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                topPackage = event.packageName
            }
        }

        // Fallback to queryUsageStats if no event found (e.g. app staying in foreground)
        if (topPackage == null) {
             val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time)
             if (stats != null && stats.isNotEmpty()) {
                 val sortedStats = stats.sortedByDescending { it.lastTimeUsed }
                 topPackage = sortedStats[0].packageName
             }
        }

        if (topPackage != null) {
            // Ignore our own overlay/app to prevent blocking ourselves or flickering
            if (topPackage == packageName) return 

            if (restrictedApps.contains(topPackage)) {
                if (temporarilyUnlockedApps.contains(topPackage)) {
                    // App is temporarily unlocked
                    if (unlockEndTimes.containsKey(topPackage) && System.currentTimeMillis() > (unlockEndTimes[topPackage] ?: 0)) {
                        // Time expired
                        temporarilyUnlockedApps.remove(topPackage)
                        unlockEndTimes.remove(topPackage)
                        hideFloatingTimer(topPackage)
                        currentBlockedPackage = topPackage
                        updateOverlayContent(topPackage)
                        showOverlay()
                    }
                } else {
                    // App is restricted and not unlocked
                    if (!isOverlayShowing || currentBlockedPackage != topPackage) {
                        currentBlockedPackage = topPackage
                        updateOverlayContent(topPackage)
                        showOverlay()
                    }
                }
            } else {
                // App is not restricted
                if (isOverlayShowing) {
                    hideOverlay()
                }
            }
            lastCheckedPackage = topPackage
        }
    }

    private fun updateOverlayContent(packageName: String) {
        val pm = packageManager
        var appName = "App"
        val isSpanish = java.util.Locale.getDefault().language.startsWith("es")
        
        val config = appConfigs[packageName]
        val configAppName = config?.optString("appName", "")
        
        try {
            if (configAppName != null && configAppName.isNotEmpty()) {
                appName = configAppName
            } else {
                val appInfo = pm.getApplicationInfo(packageName, 0)
                appName = pm.getApplicationLabel(appInfo).toString()
            }
        } catch (e: Exception) {
            // Ignore
        }

        // Calculate Stats
        val usageHistory = config?.optJSONArray("usageHistory")
        var weeklyTotal = 0
        var todayUsage = 0
        var maxUsage = 1
        val days = arrayOf("Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu") 
        
        val calendar = java.util.Calendar.getInstance()
        val dayLabels = Array(7) { "" }
        for (i in 6 downTo 0) {
            val dayName = java.text.SimpleDateFormat("E", java.util.Locale.US).format(calendar.time)
            dayLabels[i] = dayName
            calendar.add(java.util.Calendar.DAY_OF_YEAR, -1)
        }

        if (usageHistory != null && usageHistory.length() > 0) {
            for (i in 0 until usageHistory.length()) {
                val usage = usageHistory.getInt(i)
                weeklyTotal += usage
                if (usage > maxUsage) maxUsage = usage
                if (i == usageHistory.length() - 1) todayUsage = usage
            }
        }
        val dailyAvg = if (usageHistory?.length() ?: 0 > 0) weeklyTotal / usageHistory!!.length() else 0

        // Update UI Elements
        
        // 1. Header (Cronos Time) - Static, no update needed usually, but we can ensure it's set if we want dynamic
        
        // 2. Subheader
        val subheaderText = if (isSpanish) 
            "Has usado $appName por ${formatTime(todayUsage)} hoy" 
            else "You used $appName for ${formatTime(todayUsage)} today"
        subheaderView?.text = subheaderText

        // 3. Motivational Message Box
        val message = config?.optString("message", "")
        val showMessage = config?.optBoolean("showMessage", true) ?: true
        
        if (showMessage && !message.isNullOrEmpty()) {
            motivationView?.text = message
            motivationView?.visibility = View.VISIBLE
        } else {
            motivationView?.visibility = View.GONE
        }

        // 4. Chart
        chartBarsContainer?.removeAllViews()
        chartLabelsContainer?.removeAllViews()
        
        if (usageHistory != null && usageHistory.length() > 0) {
            for (i in 0 until usageHistory.length()) {
                val usage = usageHistory.getInt(i)
                
                // Bar Container
                val barContainer = android.widget.LinearLayout(this)
                barContainer.orientation = android.widget.LinearLayout.VERTICAL
                barContainer.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                val containerParams = android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.MATCH_PARENT)
                containerParams.weight = 1f
                
                // Time Label (Above Bar)
                val timeLabel = TextView(this)
                val h = usage / 60
                val m = usage % 60
                timeLabel.text = "%d:%02d".format(h, m)
                timeLabel.textSize = 10f
                timeLabel.setTextColor(0xFFE0E0E0.toInt())
                timeLabel.gravity = Gravity.CENTER
                timeLabel.setPadding(0, 0, 0, 4) // Little padding above bar
                
                // The actual bar
                val barHeightPercent = (usage.toFloat() / maxUsage.toFloat()).coerceIn(0.1f, 1f)
                val bar = View(this)
                // Thicker bars: 100px (Doubled)
                val barParams = android.widget.LinearLayout.LayoutParams(100, 0) 
                barParams.weight = barHeightPercent
                
                val barBg = android.graphics.drawable.GradientDrawable()
                barBg.cornerRadius = 12f 
                if (i == usageHistory.length() - 1) {
                    barBg.setColor(0xFFE0E0E0.toInt()) // Today: White/Grey
                } else {
                    barBg.setColor(0xFF424242.toInt()) // Others: Dark Grey
                }
                bar.background = barBg
                
                // Empty space above bar
                val emptySpace = View(this)
                val emptyParams = android.widget.LinearLayout.LayoutParams(100, 0)
                emptyParams.weight = 1f - barHeightPercent
                
                barContainer.addView(emptySpace, emptyParams)
                barContainer.addView(timeLabel) // Add label between empty space and bar
                barContainer.addView(bar, barParams)
                chartBarsContainer?.addView(barContainer, containerParams)
                
                // Label
                val label = TextView(this)
                label.text = dayLabels[i]
                label.textSize = 11f
                label.setTextColor(0xFFAAAAAA.toInt())
                label.gravity = Gravity.CENTER
                val labelParams = android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT)
                labelParams.weight = 1f
                chartLabelsContainer?.addView(label, labelParams)
            }
        }

        // 5. Stats Row (Only Daily Avg)
        statAvgValue?.text = "Daily Average: ${formatTime(dailyAvg)}"

        // 6. Action Buttons
        val cost = config?.optInt("cost", 10) ?: 10
        val durationMs = config?.optLong("duration", 5 * 60 * 1000) ?: (5 * 60 * 1000)
        val durationMin = durationMs / 60000
        
        unlockButton?.text = "Desbloquear por $durationMin minutos ($$cost)"
        notNowButton?.text = if (isSpanish) "Ahora no" else "Not now"
    }

    private fun formatTime(minutes: Int): String {
        if (minutes < 60) return "${minutes}m"
        val h = minutes / 60
        val m = minutes % 60
        return if (m > 0) "${h}h ${m}m" else "${h}h"
    }

    private var subheaderView: TextView? = null
    private var motivationView: TextView? = null
    private var chartBarsContainer: android.widget.LinearLayout? = null
    private var chartLabelsContainer: android.widget.LinearLayout? = null
    private var statAvgValue: TextView? = null

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }

    private fun createOverlayView() {
        val layout = FrameLayout(this)
        layout.setBackgroundColor(0xFF000000.toInt()) // Pure black background

        val mainContainer = android.widget.LinearLayout(this)
        mainContainer.orientation = android.widget.LinearLayout.VERTICAL
        mainContainer.gravity = Gravity.CENTER // Vertically centered
        mainContainer.setPadding(40, 40, 40, 40)
        
        val mainParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
        
        // 1. Header "Cronos Time" with Icon
        val headerLayout = android.widget.LinearLayout(this)
        headerLayout.orientation = android.widget.LinearLayout.HORIZONTAL
        headerLayout.gravity = Gravity.CENTER
        headerLayout.setPadding(0, 0, 0, 20)

        // App Icon (Cronos Time)
        val appIconView = ImageView(this)
        try {
            val myIcon = packageManager.getApplicationIcon(packageName)
            appIconView.setImageDrawable(myIcon)
        } catch (e: Exception) {
            appIconView.setImageResource(android.R.drawable.sym_def_app_icon)
        }
        val iconParams = android.widget.LinearLayout.LayoutParams(60, 60)
        iconParams.rightMargin = 20
        headerLayout.addView(appIconView, iconParams)

        // App Name
        val appNameView = TextView(this)
        appNameView.text = "Cronos Time"
        appNameView.textSize = 20f
        appNameView.setTextColor(0xFFE0E0E0.toInt())
        appNameView.typeface = android.graphics.Typeface.DEFAULT_BOLD
        headerLayout.addView(appNameView)

        mainContainer.addView(headerLayout)

        // Subheader "You opened..."
        subheaderView = TextView(this)
        subheaderView?.textSize = 14f
        subheaderView?.setTextColor(0xFFAAAAAA.toInt()) // Grey
        subheaderView?.gravity = Gravity.CENTER
        subheaderView?.setPadding(0, 0, 0, 30)
        mainContainer.addView(subheaderView)

        // 2. Motivational Message Box
        motivationView = TextView(this)
        motivationView?.textSize = 16f
        motivationView?.setTextColor(0xFFE0E0E0.toInt())
        motivationView?.gravity = Gravity.CENTER
        motivationView?.setPadding(40, 40, 40, 40)
        
        val msgBg = android.graphics.drawable.GradientDrawable()
        msgBg.setColor(0xFF2C2C2C.toInt()) // Dark Grey Fill
        msgBg.setStroke(2, 0xFFE91E63.toInt()) // Pink Border
        msgBg.cornerRadius = 20f
        motivationView?.background = msgBg
        
        val msgParams = android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        )
        msgParams.setMargins(20, 0, 20, 40)
        mainContainer.addView(motivationView, msgParams)

        // 3. Chart Section Container
        val chartCard = android.widget.LinearLayout(this)
        chartCard.orientation = android.widget.LinearLayout.VERTICAL
        val chartBg = android.graphics.drawable.GradientDrawable()
        chartBg.setColor(0xFF1E1E1E.toInt()) // Slightly lighter black
        chartBg.cornerRadius = 30f
        chartCard.background = chartBg
        chartCard.setPadding(40, 40, 40, 40)
        
        val chartCardParams = android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        )
        chartCardParams.setMargins(20, 0, 20, 40)

        // Chart Bars
        chartBarsContainer = android.widget.LinearLayout(this)
        chartBarsContainer?.orientation = android.widget.LinearLayout.HORIZONTAL
        val barsParams = android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            dpToPx(120) // Height of bars
        )
        chartCard.addView(chartBarsContainer, barsParams)

        // Chart Labels
        chartLabelsContainer = android.widget.LinearLayout(this)
        chartLabelsContainer?.orientation = android.widget.LinearLayout.HORIZONTAL
        val labelsParams = android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        )
        labelsParams.setMargins(0, 10, 0, 30)
        chartCard.addView(chartLabelsContainer, labelsParams)

        // Stats Row (Only Daily Avg)
        statAvgValue = TextView(this)
        statAvgValue?.textSize = 14f
        statAvgValue?.setTextColor(0xFFFFFFFF.toInt())
        statAvgValue?.gravity = Gravity.CENTER
        statAvgValue?.typeface = android.graphics.Typeface.DEFAULT_BOLD
        
        chartCard.addView(statAvgValue)
        mainContainer.addView(chartCard, chartCardParams)

        // 4. Action Buttons (Below Chart)
        unlockButton = Button(this)
        val btnBg = android.graphics.drawable.GradientDrawable()
        btnBg.setColor(0xFFE0E0E0.toInt()) // White button
        btnBg.cornerRadius = 25f
        unlockButton?.background = btnBg
        unlockButton?.setTextColor(0xFF000000.toInt()) // Black text
        unlockButton?.textSize = 16f
        unlockButton?.isAllCaps = false
        unlockButton?.setOnClickListener {
            unlockApp()
        }
        val btnParams = android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 
            dpToPx(50)
        )
        btnParams.setMargins(40, 0, 40, 20)
        mainContainer.addView(unlockButton, btnParams)

        notNowButton = TextView(this)
        notNowButton?.textSize = 16f
        notNowButton?.setTextColor(0xFFAAAAAA.toInt())
        notNowButton?.gravity = Gravity.CENTER
        notNowButton?.setPadding(30, 20, 30, 40)
        notNowButton?.setOnClickListener {
            val startMain = Intent(Intent.ACTION_MAIN)
            startMain.addCategory(Intent.CATEGORY_HOME)
            startMain.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(startMain)
            hideOverlay()
        }
        mainContainer.addView(notNowButton)

        layout.addView(mainContainer, mainParams)
        overlayView = layout
    }

    private var wasUnlocked = false

    private fun showOverlay() {
        if (overlayView == null) createOverlayView()
        
        if (!isOverlayShowing && overlayView != null) {
            try {
                wasUnlocked = false // Reset unlock status when showing overlay
                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    else
                        WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or 
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                    PixelFormat.TRANSLUCENT
                )
                params.gravity = Gravity.CENTER
                
                // Check if view is already attached to avoid crash
                if (overlayView?.parent == null) {
                    windowManager.addView(overlayView, params)
                    isOverlayShowing = true
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun hideOverlay() {
        if (isOverlayShowing && overlayView != null) {
            try {
                // Check if we should count this as an avoided launch
                if (!wasUnlocked && currentBlockedPackage != null) {
                    incrementAvoidedCount(currentBlockedPackage!!)
                }

                if (overlayView?.parent != null) {
                    windowManager.removeView(overlayView)
                }
                isOverlayShowing = false
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun incrementAvoidedCount(packageName: String) {
        val prefs = getSharedPreferences("AppPrefs", Context.MODE_PRIVATE)
        val currentCount = prefs.getInt("avoided_count_$packageName", 0)
        prefs.edit().putInt("avoided_count_$packageName", currentCount + 1).apply()
    }


    private fun showFloatingTimer(packageName: String) {
        if (activeTimers.containsKey(packageName)) return

        val view = createFloatingTimerView(packageName)
        
        try {
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            )
            params.gravity = Gravity.TOP or Gravity.START
            // Stagger positions slightly or put in a default spot
            params.x = 20 + (activeTimers.size * 20)
            params.y = 100 + (activeTimers.size * 150)
            
            windowManager.addView(view, params)
            activeTimers[packageName] = view
            activeTimerParams[packageName] = params
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun hideFloatingTimer(packageName: String) {
        val view = activeTimers[packageName]
        if (view != null) {
            try {
                windowManager.removeView(view)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            activeTimers.remove(packageName)
            activeTimerParams.remove(packageName)
        }
    }

    private fun hideAllFloatingTimers() {
        val iterator = activeTimers.keys.iterator()
        while (iterator.hasNext()) {
            val pkg = iterator.next()
            val view = activeTimers[pkg]
            if (view != null) {
                try {
                    windowManager.removeView(view)
                } catch (e: Exception) {}
            }
            iterator.remove()
        }
        activeTimerParams.clear()
    }

    private fun updateFloatingTimers() {
        val currentTime = System.currentTimeMillis()
        val iterator = unlockEndTimes.entries.iterator()
        
        while (iterator.hasNext()) {
            val entry = iterator.next()
            val packageName = entry.key
            val endTime = entry.value
            val remaining = endTime - currentTime
            
            if (remaining > 0) {
                val view = activeTimers[packageName]
                if (view != null && view is android.widget.LinearLayout) {
                    val minutes = remaining / 1000 / 60
                    val seconds = (remaining / 1000) % 60
                    // Assuming TextView is the second child (index 1)
                    val textView = view.getChildAt(1) as? TextView
                    textView?.text = String.format("%02d:%02d", minutes, seconds)
                }
            } else {
                // Expired
                hideFloatingTimer(packageName)
                iterator.remove() // Remove from unlockEndTimes
                temporarilyUnlockedApps.remove(packageName)
                
                // If this is the current app, trigger re-check to show overlay
                if (currentBlockedPackage == packageName || lastCheckedPackage == packageName) {
                    checkCurrentApp()
                }
            }
        }
    }
}
