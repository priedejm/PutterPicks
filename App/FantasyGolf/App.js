import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, LogBox } from 'react-native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import Home from './Components/Home';
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
      initialRouteName='Leaderboard'
      screenOptions={{
        tabBarActiveTintColor: '#ed0030',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
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
  useEffect(() => {
    // Suppress specific warnings from LogBox
    LogBox.ignoreLogs([
      'Warning: Text strings must be rendered within a <Text> component',
    ]);
    // You can also ignore all log messages (not recommended in production)
    // LogBox.ignoreAllLogs(true);
  }, []);

  return (
    <UserProvider> {/* Wrapping the app with the UserProvider */}
      <NavigationContainer>
        {Platform.OS === 'ios' ? (
          iOSTabNavigator()
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Scoreboard" component={Scoreboard} />
            <Stack.Screen name="Leaderboard" component={Leaderboard} />
            <Stack.Screen name="PlayerPicks" component={PlayerPicks} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </UserProvider>
  );
}
