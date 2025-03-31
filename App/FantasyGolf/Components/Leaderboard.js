import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native'; // No change needed for web
import { getDatabase, ref, get } from "firebase/database"; 
import { app } from '../config'; 

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const Leaderboard = () => {
  const [players, setPlayers] = useState([]); 

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {players.map((player, index) => (
        <View style={{ width: '100%', backgroundColor: '#45751e' }} key={index}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
            <View style={{maxWidth: 100, minWidth: 40, paddingRight: 5}}>
              <Text style={styles.position}>{player.position}</Text>
            </View>
            <View style={styles.playerCard}>
              <View style={styles.infoContainer}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text>Score: {player.score}</Text>
                <Text>Rounds: {player.rounds.join(', ')}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#45751e',
    paddingVertical: 10, 
    height: isIos ? undefined : 1, // This ensures proper scrolling behavior on the web. idk why.
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
    bottom: 5
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
});

export default Leaderboard;
