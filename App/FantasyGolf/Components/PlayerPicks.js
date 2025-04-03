import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { getDatabase, ref, get, child, update } from 'firebase/database';
import { app } from '../config';
import { useUser } from '../context/UserContext';
import LoginScreen from './Login';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const PlayerPicks = () => {
  const { isLoggedIn, logout, triggerScoreboardRefresh } = useUser();
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(["", "", "", "", "", "", "", ""]); // Now 8 selectors
  const [currentlySelecting, setCurrentlySelecting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [username, setUsername] = useState('');
  const [pastPicksVisible, setPastPicksVisible] = useState(false);
  const [userPicks, setUserPicks] = useState([]);
  const [lockedPicks, setLockedPicks] = useState(false);

  useEffect(() => {
    const grabUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    grabUsername();
  }, [isLoggedIn]);

  useEffect(() => {
    const featureFlagRef = ref(database, 'featureflags/lockedPicks');
    get(featureFlagRef).then((snapshot) => {
      if (snapshot.exists()) {
        setLockedPicks(snapshot.val());
      }
    }).catch((error) => {
      console.error("Error fetching feature flag:", error);
    });
  }, [isLoggedIn]);

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
  }, [isLoggedIn]);

  useEffect(() => {
    if (username) {
      const userRef = ref(database, 'users');
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const user = Object.values(usersData).find(u => u.username === username);
          if (user) {
            const userPicks = [
              user.pick1, 
              user.pick2, 
              user.pick3, 
              user.pick4, 
              user.pick5, 
              user.pick6,
              user.alt1,  // Added alt1
              user.alt2   // Added alt2
            ];
            setSelectedPlayers(userPicks); 
          }
        }
      }).catch((error) => {
        console.error(error);
      });
    }
  }, [username, isLoggedIn]);

  useEffect(() => {
    const userRef = ref(database, 'users');
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const currentUser = Object.values(usersData).find(u => u.username === username);
        if (currentUser) {
          const pickHistory = currentUser.pickHistory;
          setUserPicks(pickHistory);
        }
      }
    }).catch((error) => {
      console.error(error);
    });
  }, [username, isLoggedIn]);

  const handleSelectPlayer = (index, playerName) => {
    if (lockedPicks) {
      alert('Picks are locked!');
      return; // Prevent player selection
    }
  
    const updatedPlayers = [...selectedPlayers];
    updatedPlayers[index] = playerName;
    setSelectedPlayers(updatedPlayers);
    setCurrentlySelecting(null);
  
    setUserPicks((prevPicks) => {
      const newPickHistory = prevPicks.map((pick) => {
        if (pick.player === playerName) {
          return { ...pick, used: pick.used + 1 };
        }
        return pick;
      });
      return newPickHistory;
    });
  };

  const handleRemovePlayer = (index) => {
    const updatedPlayers = [...selectedPlayers];
    updatedPlayers[index] = "";
    setSelectedPlayers(updatedPlayers);

    setUserPicks((prevPicks) => {
      const newPickHistory = prevPicks.map((pick) => {
        if (pick.player === selectedPlayers[index]) {
          return { ...pick, used: pick.used - 1 };
        }
        return pick;
      });
      return newPickHistory;
    });
  };

  const isSaveButtonEnabled = selectedPlayers.every((player) => player !== "");

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (username) {
      const usersRef = ref(database, 'users');
      get(usersRef).then((snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const userIndex = Object.values(usersData).findIndex(u => u.username === username);
          if (userIndex !== -1) {
            const updatedUser = {
              ...usersData[userIndex],
              pick1: selectedPlayers[0], 
              pick2: selectedPlayers[1], 
              pick3: selectedPlayers[2], 
              pick4: selectedPlayers[3], 
              pick5: selectedPlayers[4], 
              pick6: selectedPlayers[5],
              alt1: selectedPlayers[6], // Save alt1
              alt2: selectedPlayers[7]  // Save alt2
            };

            const updatedUsers = [...Object.values(usersData)];
            updatedUsers[userIndex] = updatedUser;

            const updates = {};
            updates['/users'] = updatedUsers;
            update(ref(database), updates)
              .then(() => {
                alert('Picks saved successfully!');
                triggerScoreboardRefresh(); // Trigger refresh after saving picks
              })
              .catch((error) => {
                console.error('Error saving picks: ', error);
                alert('Failed to save picks.');
              });
          }
        }
      }).catch((error) => {
        console.error(error);
      });
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.pastPicksButton}
        onPress={() => setPastPicksVisible(!pastPicksVisible)}
      >
        <Text style={styles.pastPicksButtonText}>Past Picks</Text>
      </TouchableOpacity>

      <Modal
        visible={pastPicksVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPastPicksVisible(false)}
        style={{ alignItems: 'center' }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pastPicksContainer}>
            <ScrollView>
              {userPicks
                .sort((a, b) => b.used - a.used)
                .map((pick, index) => (
                  <View key={index} style={styles.pastPickCard}>
                    <Text style={styles.pastPickPlayer}>{pick.player}</Text>
                    <Text style={styles.pastPickCount}>Picked {pick.used} times</Text>
                  </View>
                ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setPastPicksVisible(false)}
          >
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.content}>
        <Text style={styles.title}>Pick Your Players</Text>

        <View style={styles.inputGrid}>
        {selectedPlayers.map((player, index) => (
          <View key={index} style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.input, currentlySelecting === index && styles.selectedInput]}
              onPress={() => {
                if (lockedPicks) {
                  alert('Picks are locked!');
                } else {
                  setCurrentlySelecting(index);
                }
              }}
            >
              <Text style={styles.inputText} numberOfLines={1}>
                {player || (currentlySelecting === index ? 'Selecting...' : (index < 6 ? 'Pick ' + (index + 1) : 'Alternates'))}
              </Text>
            </TouchableOpacity>       

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
        </View>

        <TextInput
          style={styles.searchBar}
          placeholder="Search for a player"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {currentlySelecting !== null && (
          <ScrollView contentContainerStyle={styles.playerList}>
            {filteredPlayers.map((player, index) => {
              const pickCount = userPicks.find(pick => pick.player === player.name)?.used || 0;
              const isDisabled = pickCount >= 4; // Disable if player picked 4 times

              return (
                <View style={styles.playerCard} key={index}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <TouchableOpacity
                    style={[styles.selectButton, isDisabled && styles.selectButtonDisabled]}
                    onPress={() => !isDisabled && handleSelectPlayer(currentlySelecting, player.name)}
                    disabled={isDisabled} // Disable button if player picked 4 times
                  >
                    <Text style={styles.selectButtonText}>
                      Select {pickCount > 0 && `(${pickCount})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.saveButton, !isSaveButtonEnabled && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isSaveButtonEnabled}
        >
          <Text
            style={[styles.saveButtonText, !isSaveButtonEnabled && styles.saveButtonTextDisabled]}
          >
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
    height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web

  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    top: 10,
  },
  logoutText: {
    paddingRight: 20,
    color: 'white',
  },
  pastPicksButton: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  pastPicksButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  pastPicksContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  pastPickCard: {
    marginBottom: 10,
  },
  pastPickPlayer: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pastPickCount: {
    fontSize: 14,
    color: '#555',
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
  },
  closeModalText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    maxWidth: 500,
    minWidth: 300,
    alignSelf: 'center',
    top: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inputContainer: {
    width: '30%',
    marginBottom: 10,
    position: 'relative',
  },
  input: {
    height: 35,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 8,
    backgroundColor: 'white',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedInput: {
    backgroundColor: '#cce5ff',
  },
  inputText: {
    fontSize: 14,
    color: '#000',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 4,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchBar: {
    height: 35,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 8,
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
  },
  playerList: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  playerCard: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'black',
    fontSize: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonTextDisabled: {
    color: '#777',
  },
});

export default PlayerPicks;
