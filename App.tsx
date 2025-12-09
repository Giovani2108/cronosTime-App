import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletProvider } from './src/context/WalletContext';
import { AppProvider } from './src/context/AppContext';
import { TimerProvider } from './src/context/TimerContext';
import { TaskProvider } from './src/context/TaskContext';

import PermissionsScreen from './src/screens/PermissionsScreen';
import OverlayScreen from './src/screens/OverlayScreen';
import AppConfigScreen from './src/screens/AppConfigScreen';
import CustomizationScreen from './src/screens/CustomizationScreen';
import MainNavigator from './src/navigation/MainNavigator';

const Stack = createNativeStackNavigator();

import { ThemeProvider } from './src/context/ThemeContext';

const App = () => {
  return (
    <ThemeProvider>
      <WalletProvider>
        <AppProvider>
          <TimerProvider>
            <TaskProvider>
              <NavigationContainer>
                <Stack.Navigator initialRouteName="Main">
                  <Stack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
                  <Stack.Screen name="Permissions" component={PermissionsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="AppConfig" component={AppConfigScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="Overlay" component={OverlayScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="Customization" component={CustomizationScreen} options={{ headerShown: false }} />
                </Stack.Navigator>
              </NavigationContainer>
            </TaskProvider>
          </TimerProvider>
        </AppProvider>
      </WalletProvider>
    </ThemeProvider>
  );
};

export default App;
