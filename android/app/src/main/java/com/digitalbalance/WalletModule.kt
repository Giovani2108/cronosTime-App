package com.digitalbalance

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WalletModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences = reactContext.getSharedPreferences("WalletPrefs", Context.MODE_PRIVATE)

    override fun getName(): String {
        return "WalletModule"
    }

    @ReactMethod
    fun getBalance(promise: Promise) {
        val balance = prefs.getInt("coin_balance", 0)
        promise.resolve(balance)
    }

    @ReactMethod
    fun addCoins(amount: Int, promise: Promise) {
        val currentBalance = prefs.getInt("coin_balance", 0)
        val newBalance = currentBalance + amount
        prefs.edit().putInt("coin_balance", newBalance).apply()
        promise.resolve(newBalance)
    }

    @ReactMethod
    fun deductCoins(amount: Int, promise: Promise) {
        val currentBalance = prefs.getInt("coin_balance", 0)
        if (currentBalance >= amount) {
            val newBalance = currentBalance - amount
            prefs.edit().putInt("coin_balance", newBalance).apply()
            promise.resolve(newBalance)
        } else {
            promise.reject("INSUFFICIENT_FUNDS", "Not enough coins")
        }
    }
}
