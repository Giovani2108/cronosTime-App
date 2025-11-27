import React, { createContext, useState, useEffect, useContext } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { OverlayModule, UsageStatsModule } = NativeModules;

export interface AppItem {
    packageName: string;
    appName: string;
    icon: string; // Base64
    isRestricted: boolean;
    unlockCost: number;
    unlockDuration: number;
    usageTime?: number;
}

interface AppContextType {
    apps: AppItem[];
    toggleRestriction: (packageName: string) => void;
    updateAppConfig: (packageName: string, cost: number, duration: number) => void;
    loadApps: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
    apps: [],
    toggleRestriction: () => { },
    updateAppConfig: () => { },
    loadApps: async () => { },
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apps, setApps] = useState<AppItem[]>([]);

    useEffect(() => {
        loadApps();
    }, []);

    const sortApps = (appList: AppItem[]) => {
        return appList.sort((a, b) => {
            if (a.isRestricted !== b.isRestricted) {
                return a.isRestricted ? -1 : 1;
            }
            // If both are restricted or both are unrestricted, sort by usage time (descending)
            const usageA = a.usageTime || 0;
            const usageB = b.usageTime || 0;
            return usageB - usageA;
        });
    };

    const syncWithNativeService = (appList: AppItem[]) => {
        const restrictedAppsConfig: { [key: string]: { cost: number; duration: number } } = {};
        appList.filter(a => a.isRestricted).forEach(a => {
            restrictedAppsConfig[a.packageName] = {
                cost: a.unlockCost,
                duration: a.unlockDuration
            };
        });
        OverlayModule.startMonitoring(JSON.stringify(restrictedAppsConfig));
    };

    const loadApps = async () => {
        try {
            // 1. Load from cache first
            const cachedApps = await AsyncStorage.getItem('cached_apps');
            if (cachedApps) {
                const parsedApps = JSON.parse(cachedApps);
                setApps(parsedApps);
                syncWithNativeService(parsedApps);
            }

            // 2. Fetch from native (background update)
            const installedApps = await UsageStatsModule.getInstalledApps();

            setApps(prevApps => {
                const newApps = installedApps.map((app: any) => {
                    const existing = prevApps.find(a => a.packageName === app.packageName);
                    return {
                        ...app,
                        isRestricted: existing ? existing.isRestricted : false,
                        unlockCost: existing ? existing.unlockCost : 10,
                        unlockDuration: existing ? existing.unlockDuration : 5 * 60 * 1000,
                    };
                });

                const sortedApps = sortApps(newApps);
                // Save to cache
                AsyncStorage.setItem('cached_apps', JSON.stringify(sortedApps));
                syncWithNativeService(sortedApps);
                return sortedApps;
            });

        } catch (error) {
            console.error("Failed to load apps", error);
        }
    };

    const toggleRestriction = async (packageName: string) => {
        setApps(prevApps => {
            const newApps = prevApps.map(app =>
                app.packageName === packageName ? { ...app, isRestricted: !app.isRestricted } : app
            );
            const sortedApps = sortApps(newApps);
            AsyncStorage.setItem('cached_apps', JSON.stringify(sortedApps));
            syncWithNativeService(sortedApps);
            return sortedApps;
        });
    };

    const updateAppConfig = async (packageName: string, cost: number, duration: number) => {
        setApps(prevApps => {
            const newApps = prevApps.map(app =>
                app.packageName === packageName ? { ...app, unlockCost: cost, unlockDuration: duration } : app
            );
            AsyncStorage.setItem('cached_apps', JSON.stringify(newApps));
            syncWithNativeService(newApps);
            return newApps;
        });
    };

    return (
        <AppContext.Provider value={{ apps, toggleRestriction, updateAppConfig, loadApps }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApps = () => useContext(AppContext);
