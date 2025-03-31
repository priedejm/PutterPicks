import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import Login from './Components/Login';
import Scoreboard from './Components/Scoreboard';
import Leaderboard from './Components/Leaderboard';
import PlayerPicks from './Components/PlayerPicks';
import { UserProvider } from './context/UserContext'; // Importing context

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function iOSTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Scoreboard"
        component={Scoreboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="scoreboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={Leaderboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PlayerPicks"
        component={PlayerPicks}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <UserProvider> {/* Wrapping the app with the UserProvider */}
      <NavigationContainer>
        {Platform.OS === 'ios' ? (
          iOSTabNavigator()
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Scoreboard" component={Scoreboard} />
            <Stack.Screen name="Leaderboard" component={Leaderboard} />
            <Stack.Screen name="PlayerPicks" component={PlayerPicks} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </UserProvider>
  );
}
