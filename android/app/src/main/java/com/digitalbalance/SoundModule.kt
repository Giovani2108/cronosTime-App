package com.digitalbalance

import android.media.AudioAttributes
import android.media.SoundPool
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SoundModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var soundPool: SoundPool? = null
    private var bubbleSoundId: Int = 0
    private var purchaseSoundId: Int = 0

    init {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        soundPool = SoundPool.Builder()
            .setMaxStreams(2)
            .setAudioAttributes(audioAttributes)
            .build()

        bubbleSoundId = soundPool?.load(reactContext, R.raw.bubble_pop, 1) ?: 0
        purchaseSoundId = soundPool?.load(reactContext, R.raw.purchase_success, 1) ?: 0
    }

    override fun getName(): String {
        return "SoundModule"
    }

    @ReactMethod
    fun playBubblePop() {
        soundPool?.play(bubbleSoundId, 1f, 1f, 1, 0, 1f)
    }

    @ReactMethod
    fun playPurchaseSuccess() {
        soundPool?.play(purchaseSoundId, 1f, 1f, 1, 0, 1f)
    }
}
