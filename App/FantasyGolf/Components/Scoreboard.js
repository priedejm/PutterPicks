import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../config';
import LoginScreen from './Login';
import { useUser } from '../context/UserContext';

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const Scoreboard = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]); 
  const { isLoggedIn, setIsLoggedIn } = useUser();

  useEffect(() => {
    const playersRef = ref(database, 'players/players');
    get(playersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setPlayers(Object.values(snapshot.val())); 
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }, []);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val()); // Assuming snapshot.val() gives us the list of users
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }, []);

  // Function to get the score of a player by their name
  const getPlayerScore = (playerName) => {
    const player = players.find(player => player.name === playerName);
    if (player) {
      const score = player.score;

      // Convert score to numeric value
      if (score === "E") return 0;
      if (score.includes("+")) return parseInt(score.replace("+", ""));
      if (score.includes("-")) return parseInt(score);
      return 0; // Return 0 if score is unknown or missing
    }
    return 0; // If player is not found
  };

  // Function to calculate the total score for a user based on their picks
  const calculateTotalScore = (user) => {
    const totalScore = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6]
      .map(pick => getPlayerScore(pick)) // Get the score for each pick
      .reduce((total, score) => total + score, 0); // Sum the scores
    return totalScore;
  };

  // Sort users by total score (ascending order)
  const sortedUsers = [...users].sort((a, b) => calculateTotalScore(a) - calculateTotalScore(b));

  if (!isLoggedIn) {
    return <LoginScreen setIsLoggedIn={setIsLoggedIn}/>; // Show login screen if not logged in
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {sortedUsers.map((user, index) => {
        const totalScore = calculateTotalScore(user); // Calculate the total score for this user

        return (
          <View style={{ width: '100%', backgroundColor: '#45751e' }} key={index}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ maxWidth: 100, minWidth: 40, paddingRight: 5 }}>
                <Text style={styles.position}>{index + 1}</Text>
              </View>
              <View style={styles.playerCard}>
                {/* Display the total score */}
                <View style={{ position: 'absolute', top: -5, right: 10 }}>
                  <Text style={styles.totalScore}>{totalScore}</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.playerName}>{user.username}</Text>
                  {/* Render each pick with the player's score */}
                  {[user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].map((pick, i) => (
                    <Text key={i}>
                       {!pick && 'Pick'} {i + 1}: {pick} {'|'} {getPlayerScore(pick)}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#45751e',
    paddingVertical: 10,
    height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web
  },
  playerCard: {
    width: 250,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row', // Align items horizontally
    justifyContent: 'space-between', // Distribute items with space between them
  },
  position: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    bottom: 5,
  },
  infoContainer: {
    flex: 3, // Takes the remaining space
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#45751e',
  },
  totalScore: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#45751e',
  },
});

export default Scoreboard;
