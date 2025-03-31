import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { getDatabase, ref, get, update } from 'firebase/database';
import { app } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For accessing stored username

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const PlayerPicks = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(["", "", "", "", "", ""]); // 6 player picks
  const [currentlySelecting, setCurrentlySelecting] = useState(null); // Index of the input currently being selected
  const [searchQuery, setSearchQuery] = useState(''); // State to manage search query
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Fetch username from AsyncStorage
    const fetchUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);

      // Fetch the user's picks from Firebase if username is found
      if (storedUsername) {
        const userRef = ref(database, 'users');
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const users = snapshot.val();
            let userId = '';
            
            // Find the user by username
            Object.keys(users).forEach(id => {
              if (users[id].username === storedUsername) {
                userId = id;
              }
            });
            
            if (userId) {
              // Get the user's picks from the database
              const userPicks = users[userId];
              const updatedSelectedPlayers = [
                userPicks.pick1 || "",
                userPicks.pick2 || "",
                userPicks.pick3 || "",
                userPicks.pick4 || "",
                userPicks.pick5 || "",
                userPicks.pick6 || "",
              ];
              setSelectedPlayers(updatedSelectedPlayers); // Set initial player picks
            }
          } else {
            console.log("No users found");
          }
        }).catch((error) => {
          console.error("Error fetching user data: ", error);
        });
      }
    };

    // Fetch players data from Firebase
    const playersRef = ref(database, 'players/players');
    get(playersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setPlayers(Object.values(snapshot.val())); // Set player data
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });

    fetchUsername();
  }, []);

  const handleSelectPlayer = (index, playerName) => {
    const updatedPlayers = [...selectedPlayers];
    updatedPlayers[index] = playerName;
    setSelectedPlayers(updatedPlayers);
    setCurrentlySelecting(null); // Reset the currently selecting state after a selection
  };

  const handleRemovePlayer = (index) => {
    const updatedPlayers = [...selectedPlayers];
    updatedPlayers[index] = ""; // Remove player by setting it to an empty string
    setSelectedPlayers(updatedPlayers);
  };

  const handleSavePicks = () => {
    const userRef = ref(database, 'users');
    
    // Find the user by username
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        let userId = '';
        
        // Find the user by username
        Object.keys(users).forEach(id => {
          if (users[id].username === username) {
            userId = id;
          }
        });
        
        if (userId) {
          const updatedPicks = {
            pick1: selectedPlayers[0],
            pick2: selectedPlayers[1],
            pick3: selectedPlayers[2],
            pick4: selectedPlayers[3],
            pick5: selectedPlayers[4],
            pick6: selectedPlayers[5],
          };
          
          // Update the user's picks
          update(ref(database, 'users/' + userId), updatedPicks)
            .then(() => {
              alert("Picks saved successfully");
            })
            .catch((error) => {
              console.error("Error updating picks: ", error);
            });
        } else {
          console.log("User not found");
        }
      } else {
        console.log("No users found");
      }
    }).catch((error) => {
      console.error(error);
    });
  };

  const isSaveButtonEnabled = selectedPlayers.every((player) => player !== "");

  // Filter the players based on the search query
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{maxWidth: 500,minWidth:300, alignSelf: 'center'}}>
      <Text style={styles.title}>Pick Your Players</Text>

      {/* Render 6 input fields */}
      {selectedPlayers.map((player, index) => (
        <View key={index} style={styles.inputContainer}>
          {/* Touchable to detect tap on the TextInput */}
          <TouchableOpacity
            style={[styles.input, currentlySelecting === index && styles.selectedInput]}
            onPress={() => setCurrentlySelecting(index)} // Set the index of the focused input
          >
            <Text style={styles.inputText}>
              {player || (currentlySelecting === index ? 'Selecting...' : 'Pick Player ' + (index + 1))}
            </Text>
          </TouchableOpacity>

          {/* Show an "X" button to remove the selected player */}
          {player && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemovePlayer(index)}
            >
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search for a player"
        value={searchQuery}
        onChangeText={setSearchQuery} // Update search query as user types
      />

      {/* Display the player selection list when an input is clicked */}
      {currentlySelecting !== null && (
        <ScrollView contentContainerStyle={styles.playerList}>
          {filteredPlayers.map((player, index) => (
            <View style={styles.playerCard} key={index}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Button
                title="Select"
                onPress={() => handleSelectPlayer(currentlySelecting, player.name)} // Fill the selected input
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, !isSaveButtonEnabled && styles.saveButtonDisabled]}
        onPress={handleSavePicks}
        disabled={!isSaveButtonEnabled}
      >
        <Text style={[styles.saveButtonText, !isSaveButtonEnabled && styles.saveButtonTextDisabled]}>
          Save
        </Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#45751e',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    backgroundColor: 'white',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    flex: 1,
  },
  selectedInput: {
    backgroundColor: '#cce5ff', // Highlight the input with a light blue when selected
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  removeButton: {
    marginLeft: 10,
    backgroundColor: '#f44336',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  playerList: {
    marginBottom: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  playerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#45751e',
  },
  saveButton: {
    backgroundColor: 'pink', // Green background when enabled
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: 'grey', // Lighter color when disabled
  },
  saveButtonText: {
    color: 'black',
    fontSize: 18,
  },
  saveButtonTextDisabled: {
    color: '#d1d1d1', // Lighter text color when disabled
  },
});

export default PlayerPicks;
