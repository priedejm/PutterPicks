// src/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native'; // Import navigation container
import { createStackNavigator } from '@react-navigation/stack'; // Import stack navigator
import Login from './Components/Login';  // Import LoginScreen component
import Home from './Components/Home';    // Import HomeScreen component
import Leaderboard from './Components/Leaderboard'; // Import Leaderboard screen
import Scoreboard from './Components/Scoreboard'; 
import PlayerPicks from './Components/PlayerPicks'; 

const Stack = createStackNavigator(); // Create a Stack Navigator

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ title: 'Home', headerLeft: () => null,}} />
        <Stack.Screen name="Leaderboard" component={Leaderboard} options={{ title: 'Leaderboard' }} />
        <Stack.Screen name="Scoreboard" component={Scoreboard} options={{ title: 'Scoreboard' }} />
        <Stack.Screen name="PlayerPicks" component={PlayerPicks} options={{ title: 'PlayerPicks' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
