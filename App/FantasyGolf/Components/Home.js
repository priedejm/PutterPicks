import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import the navigation hook

const HomeScreen = () => {
  const navigation = useNavigation(); // Initialize the navigation hook

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Fantasy Golf App</Text>

      {/* Custom styled button to navigate to Leaderboard */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Leaderboard')}
      >
        <Text style={styles.buttonText}>Go to Leaderboard</Text>
      </TouchableOpacity>

      {/* Custom styled button to navigate to Scoreboard */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Scoreboard')}
      >
        <Text style={styles.buttonText}>Go to Scoreboard</Text>
      </TouchableOpacity>

      {/* Custom styled button to navigate to Picks */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('PlayerPicks')}
      >
        <Text style={styles.buttonText}>Make your Picks</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center', // Center horizontally
    backgroundColor: '#305115',
    paddingTop: 50, // Add padding at the top to avoid title being too close to the top
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center', // Make sure title is centered horizontally
  },
  // Custom styled button
  button: {
    backgroundColor: '#fff', // White background
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20, // Add some space at the top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: 225
  },
  buttonText: {
    color: '#305115', // Green text
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
