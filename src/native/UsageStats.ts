import { NativeModules } from 'react-native';

const { UsageStatsModule } = NativeModules;

export interface UsageStatsInterface {
    checkUsagePermission(): Promise<boolean>;
    requestUsagePermission(): void;
    getInstalledApps(): Promise<any[]>;
    getTopPackageName(): Promise<string>;
}

export default UsageStatsModule as UsageStatsInterface;
