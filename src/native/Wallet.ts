import { NativeModules } from 'react-native';

const { WalletModule } = NativeModules;

export interface WalletInterface {
    getBalance(): Promise<number>;
    addCoins(amount: number): Promise<number>;
    deductCoins(amount: number): Promise<number>;
}

export default WalletModule as WalletInterface;
