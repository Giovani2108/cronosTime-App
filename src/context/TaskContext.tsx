import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from './WalletContext';

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'custom';
export type RecurrenceType = 'none' | 'daily' | 'weekly';
export type FirstDayOfWeek = 'Saturday' | 'Sunday' | 'Monday';
export type NextWeekBehavior = 'sameDay' | 'startOfWeek';

export interface Task {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    coinsReward: number;
    dueDate: string; // ISO Date string
    isCompleted: boolean;
    recurrence: RecurrenceType;
    selectedDays?: number[]; // 0-6 for Sunday-Saturday (used if weekly)
    reminderEnabled: boolean;
    reminderTime?: string; // ISO Date string
    completedAt?: number;
}

interface TaskContextType {
    tasks: Task[];
    addTask: (task: Omit<Task, 'id' | 'isCompleted'>) => Promise<void>;
    completeTask: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    getTaskReward: (difficulty: Difficulty) => number;
    loadTasks: () => Promise<void>;
    firstDayOfWeek: FirstDayOfWeek;
    setFirstDayOfWeek: (day: FirstDayOfWeek) => void;
    nextWeekBehavior: NextWeekBehavior;
    setNextWeekBehavior: (behavior: NextWeekBehavior) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [firstDayOfWeek, setFirstDayOfWeekState] = useState<FirstDayOfWeek>('Monday');
    const [nextWeekBehavior, setNextWeekBehaviorState] = useState<NextWeekBehavior>('sameDay');

    // Get wallet functions
    const { addCoins, deductCoins } = useWallet();

    useEffect(() => {
        loadTasks();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedDay = await AsyncStorage.getItem('firstDayOfWeek');
            if (savedDay) setFirstDayOfWeekState(savedDay as FirstDayOfWeek);

            const savedBehavior = await AsyncStorage.getItem('nextWeekBehavior');
            if (savedBehavior) setNextWeekBehaviorState(savedBehavior as NextWeekBehavior);
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const setFirstDayOfWeek = async (day: FirstDayOfWeek) => {
        setFirstDayOfWeekState(day);
        await AsyncStorage.setItem('firstDayOfWeek', day);
    };

    const setNextWeekBehavior = async (behavior: NextWeekBehavior) => {
        setNextWeekBehaviorState(behavior);
        await AsyncStorage.setItem('nextWeekBehavior', behavior);
    };

    const loadTasks = async () => {
        try {
            const savedTasks = await AsyncStorage.getItem('tasks');
            if (savedTasks) {
                setTasks(JSON.parse(savedTasks));
            }
        } catch (e) {
            console.error('Failed to load tasks', e);
        }
    };

    const saveTasks = async (newTasks: Task[]) => {
        setTasks(newTasks);
        try {
            await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
        } catch (e) {
            console.error('Failed to save tasks', e);
        }
    };

    const getTaskReward = (difficulty: Difficulty): number => {
        switch (difficulty) {
            case 'trivial': return 1;
            case 'easy': return 1;
            case 'medium': return 3;
            case 'hard': return 5;
            case 'custom': return 0; // Manual
            default: return 1;
        }
    };

    const addTask = async (taskData: Omit<Task, 'id' | 'isCompleted'>) => {
        const newTask: Task = {
            ...taskData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            isCompleted: false,
        };
        const newTasks = [...tasks, newTask];
        await saveTasks(newTasks);
    };

    const completeTask = async (id: string) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;

        const task = tasks[taskIndex];
        let newTasks = [...tasks];

        if (task.isCompleted) {
            // Uncheck: Just revert to incomplete
            newTasks[taskIndex] = { ...task, isCompleted: false, completedAt: undefined };
            await deductCoins(task.coinsReward);
        } else {
            // Check (Complete)
            if (task.recurrence === 'none') {
                newTasks[taskIndex] = { ...task, isCompleted: true, completedAt: Date.now() };
                await addCoins(task.coinsReward);
            } else {
                // ... logic for recurrence ...
                // For recurring tasks, we complete *one instance*. Effectively we give rewards for that instance.
                await addCoins(task.coinsReward);

                // ... (Recurrence logic remains same) ...
                const nextDate = new Date(task.dueDate);
                const today = new Date();

                if (nextDate < today) {
                    nextDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
                }

                if (task.recurrence === 'daily') {
                    nextDate.setDate(nextDate.getDate() + 1);
                } else if (task.recurrence === 'weekly' && task.selectedDays && task.selectedDays.length > 0) {
                    let found = false;
                    for (let i = 1; i <= 7; i++) {
                        nextDate.setDate(nextDate.getDate() + 1);
                        if (task.selectedDays.includes(nextDate.getDay())) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        nextDate.setDate(nextDate.getDate() + 7);
                    }
                }

                newTasks[taskIndex] = {
                    ...task,
                    dueDate: nextDate.toISOString(),
                    isCompleted: false // Recurrence triggers new instance effectively
                };
            }
        }

        // Limit completed tasks to 10
        const resultTasks = [...newTasks];
        const completedTasks = resultTasks.filter(t => t.isCompleted).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

        if (completedTasks.length > 10) {
            // Identify tasks to remove (the oldest ones beyond the top 10)
            const tasksToRemove = completedTasks.slice(10).map(t => t.id);
            const finalTasks = resultTasks.filter(t => !tasksToRemove.includes(t.id));
            await saveTasks(finalTasks);
        } else {
            await saveTasks(newTasks);
        }
    };

    const deleteTask = async (id: string) => {
        const newTasks = tasks.filter(t => t.id !== id);
        await saveTasks(newTasks);
    };

    const updateTask = async (updatedTask: Task) => {
        const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        await saveTasks(newTasks);
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            addTask,
            completeTask,
            deleteTask,
            updateTask,
            getTaskReward,
            loadTasks,
            firstDayOfWeek,
            setFirstDayOfWeek,
            nextWeekBehavior,
            setNextWeekBehavior
        }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};
