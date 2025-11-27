package com.digitalbalance

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class DigitalBalancePackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        val modules = mutableListOf<NativeModule>()
        modules.add(UsageStatsModule(reactContext))
        modules.add(MonitorServiceModule(reactContext))
        modules.add(OverlayModule(reactContext))
        modules.add(SoundModule(reactContext))
        modules.add(WalletModule(reactContext))
        return modules
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
