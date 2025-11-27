import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OverlayModule from '../native/Overlay';

interface TimerContextType {
    timeRemaining: number;
    isActive: boolean;
    startTimer: (minutes: number) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isActive, setIsActive] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadTimerState();
        return () => stopInterval();
    }, []);

    useEffect(() => {
        if (isActive && timeRemaining > 0) {
            if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                    setTimeRemaining((prev) => {
                        if (prev <= 1) {
                            stopInterval();
                            setIsActive(false);
                            OverlayModule.stopOverlay();
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } else {
            stopInterval();
        }
        saveTimerState();
    }, [isActive, timeRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

    const stopInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const loadTimerState = async () => {
        try {
            const savedTime = await AsyncStorage.getItem('timer_remaining');
            if (savedTime) {
                setTimeRemaining(parseInt(savedTime, 10));
            }
        } catch (e) {
            console.error("Failed to load timer", e);
        }
    };

    const saveTimerState = async () => {
        try {
            await AsyncStorage.setItem('timer_remaining', timeRemaining.toString());
        } catch (e) {
            console.error("Failed to save timer", e);
        }
    };

    const startTimer = (minutes: number) => {
        setTimeRemaining(minutes * 60);
        setIsActive(true);
        OverlayModule.stopOverlay();
    };

    const pauseTimer = () => {
        setIsActive(false);
    };

    const resumeTimer = () => {
        if (timeRemaining > 0) {
            setIsActive(true);
        }
    };

    return (
        <TimerContext.Provider value={{ timeRemaining, isActive, startTimer, pauseTimer, resumeTimer }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};
