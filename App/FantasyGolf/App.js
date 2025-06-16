import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, LogBox } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Home from './Components/Home';
import Login from './Components/Login';
import Scoreboard from './Components/Scoreboard';
import Leaderboard from './Components/Leaderboard';
import PlayerPicks from './Components/PlayerPicks';
import SeasonLongLeaderboard from './Components/GameModes/SeasonLongLeaderboard';
import { UserProvider } from './context/UserContext';
import Dashboard from './Components/Dashboard';
import PoolSettings from './Components/PoolSettings';
import PoolDetails from './Components/PoolDetails';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert } from 'react-native';



const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs({ route }) {
  const { selectedPool } = route.params ?? {};

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
        initialParams={{ selectedPool }}
        children={() => <Scoreboard selectedPool={selectedPool} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="scoreboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        initialParams={{ selectedPool }}
        children={() => <Leaderboard selectedPool={selectedPool} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PlayerPicks"
        initialParams={{ selectedPool }}
        children={() => <PlayerPicks selectedPool={selectedPool} />}
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
    LogBox.ignoreLogs([
      'Warning: Text strings must be rendered within a <Text> component',
    ]);
  
    // Foreground handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  
    // Listener for received notifications while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      // Alert.alert(title || 'Notification', body || 'You have a new message');
    });
  
    // Listener for when user taps the notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });
  
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);
  

  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Initial screen with NO bottom tabs */}
          <Stack.Screen name="Dashboard" component={Dashboard} />

          {/* Bottom tabs appear after this point */}
          <Stack.Screen name="Main" component={BottomTabs} />
          
          <Stack.Screen name="SeasonLongLeaderboard" component={SeasonLongLeaderboard} />
          <Stack.Screen name="PoolSettings" component={PoolSettings} />
          <Stack.Screen name="PoolDetails" component={PoolDetails} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
