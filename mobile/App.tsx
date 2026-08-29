import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useStore } from './src/store';

export default function App() {
  const loadProfile = useStore((s) => s.loadProfile);

  useEffect(() => { loadProfile(); }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
