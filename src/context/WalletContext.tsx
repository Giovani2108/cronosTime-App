import React, { createContext, useState, useEffect, useContext } from 'react';
import { AppState } from 'react-native';
import WalletModule from '../native/Wallet';

interface WalletContextType {
  coins: number;
  addCoins: (amount: number) => Promise<void>;
  deductCoins: (amount: number) => Promise<boolean>;
  spendCoins: (amount: number) => Promise<boolean>;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coins, setCoins] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCoins();

    // Refresh balance when app comes to foreground (in case service deducted coins)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        loadCoins();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadCoins = async () => {
    try {
      const balance = await WalletModule.getBalance();
      setCoins(balance);
    } catch (e) {
      console.error("Failed to load coins", e);
    } finally {
      setIsLoading(false);
    }
  };

  const addCoins = async (amount: number) => {
    try {
      const newBalance = await WalletModule.addCoins(amount);
      setCoins(newBalance);
    } catch (e) {
      console.error("Failed to add coins", e);
    }
  };

  const deductCoins = async (amount: number): Promise<boolean> => {
    try {
      const newBalance = await WalletModule.deductCoins(amount);
      setCoins(newBalance);
      return true;
    } catch (e) {
      console.error("Failed to deduct coins", e);
      return false;
    }
  };

  const spendCoins = deductCoins;

  return (
    <WalletContext.Provider value={{ coins, addCoins, deductCoins, spendCoins, isLoading }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
