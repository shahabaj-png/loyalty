import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import RewardsScreen from '../screens/RewardsScreen';
import GamificationScreen from '../screens/GamificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import RewardDetailScreen from '../screens/RewardDetailScreen';
import IdentityScreen from '../screens/IdentityScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, any> = {
            Home: focused ? 'home' : 'home-outline',
            Rewards: focused ? 'gift' : 'gift-outline',
            Play: focused ? 'game-controller' : 'game-controller-outline',
            Leaderboard: focused ? 'trophy' : 'trophy-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        headerStyle: { backgroundColor: '#6366F1' },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Rewards' }} />
      <Tab.Screen name="Play" component={GamificationScreen} options={{ title: 'Play' }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Rankings' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#6366F1' }, headerTintColor: '#FFF' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transaction History' }} />
            <Stack.Screen name="RewardDetail" component={RewardDetailScreen} options={{ title: 'Reward Details' }} />
            <Stack.Screen name="Identity" component={IdentityScreen} options={{ title: 'Identity Verification' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
