import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { getDatabase, ref, get, update, onValue } from 'firebase/database';
import { app } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {scale} from 'react-native-size-matters';

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const SALARY_CAP = 50000;
const PLAYER_COST = 5000;
const iosWidth = Dimensions.get('window').width;


const SalaryCapPlayerPicks = ({ selectedPool, setSelectedPool }) => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(["", "", "", "", "", ""]);
  const [currentlySelecting, setCurrentlySelecting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [username, setUsername] = useState('');
  const [lockedPicks, setLockedPicks] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const grabUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setIsLoggedIn(true);
        setUsername(storedUsername);
      }
    };
    grabUsername();
  }, []);

  useEffect(() => {
    const lockedPicksRef = ref(database, 'featureflags/lockedPicks');
    const listener = onValue(lockedPicksRef, (snapshot) => {
      if (snapshot.exists()) {
        setLockedPicks(snapshot.val());
      }
    });
    return () => {
      listener();
    };
  }, []);

  useEffect(() => {
    const playersRef = ref(database, 'players/players');
    get(playersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setPlayers(Object.values(snapshot.val()));
      }
    }).catch((error) => {
      console.error(error);
    });
  }, []);

  useEffect(() => {
    if (username) {
      const user = Object.values(selectedPool?.users || {}).find(u => u.username === username);
      if (user) {
        const userPicks = [
          user.pick1,
          user.pick2,
          user.pick3,
          user.pick4,
          user.pick5,
          user.pick6
        ];
        setSelectedPlayers(userPicks);
      }
    }
  }, [username, selectedPool]);

  const handleSelectPlayer = (index, playerName) => {
    if (lockedPicks) {
      alert('Picks are locked!');
      return;
    }

    const updatedPlayers = [...selectedPlayers];
    updatedPlayers[index] = playerName;
    setSelectedPlayers(updatedPlayers);

    const nextIndex = index + 1;
    if (nextIndex < selectedPlayers.length) {
      setCurrentlySelecting(nextIndex);
    } else {
      setCurrentlySelecting(null);
    }
  };

  const handleRemovePlayer = (index) => {
    const updatedPlayers = [...selectedPlayers];
    updatedPlayers[index] = "";
    setSelectedPlayers(updatedPlayers);
  };

  const currentSalary = selectedPlayers.filter(p => p !== "").length * PLAYER_COST;
  const pickedPlayersCount = selectedPlayers.filter(p => p !== "").length;
  const averageSalary = pickedPlayersCount > 0 ? (currentSalary / pickedPlayersCount) : 0;
  const remainingSalary = SALARY_CAP - currentSalary;

  const isSaveButtonEnabled = selectedPlayers.every(player => player !== "") && currentSalary <= SALARY_CAP;

  const filteredPlayers = players
    .filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(player =>
      !selectedPlayers.includes(player.name)
    )
    .sort((a, b) => {
      const oddsA = parseInt(a.odds_to_win);
      const oddsB = parseInt(b.odds_to_win);
      return oddsA - oddsB;
  });

  const handleSave = async () => {
    if (currentSalary > SALARY_CAP) {
      alert(`You are over the salary cap of $${SALARY_CAP}.`);
      return;
    }

    const poolName = selectedPool?.name;
    if (!username || !poolName) return;

    const db = getDatabase();

    try {
      const snapshot = await get(ref(db, 'pools'));
      if (!snapshot.exists()) return;

      const poolsObj = snapshot.val();
      const poolEntries = Object.entries(poolsObj);
      const foundPool = poolEntries.find(([_, pool]) => pool.name === poolName);

      if (!foundPool) {
        console.error(`Pool with name "${poolName}" not found.`);
        return;
      }

      const [poolKey, poolData] = foundPool;
      if (!poolData.users) {
        console.error(`No users found in pool "${poolName}".`);
        return;
      }

      const userEntries = Object.entries(poolData.users);
      const foundUser = userEntries.find(([_, user]) => user.username === username);

      if (!foundUser) {
        console.error(`User "${username}" not found in pool "${poolName}".`);
        return;
      }

      const [userKey, userData] = foundUser;

      const updatedUser = {
        ...userData,
        pick1: selectedPlayers[0],
        pick2: selectedPlayers[1],
        pick3: selectedPlayers[2],
        pick4: selectedPlayers[3],
        pick5: selectedPlayers[4],
        pick6: selectedPlayers[5]
      };

      const userRef = ref(db, `pools/${poolKey}/users/${userKey}`);
      await update(userRef, updatedUser);

      const updatedUsers = [...selectedPool.users]; // Make a shallow copy (still an array)
      updatedUsers[userKey] = updatedUser; // userKey is already the index/key
      
      setSelectedPool({
        ...selectedPool,
        users: updatedUsers
      });

      alert('Picks saved successfully!');

    } catch (error) {
      console.error('Error saving picks: ', error);
      alert('Failed to save picks.');
    }
  };

  const formatAbbreviated = (value) => {
    return `$${Math.floor(value / 1000)}k`;
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => setShowInstructions(!showInstructions)}
            style={styles.instructionsToggle}
          >
            <Text style={styles.headerTitle}>Salary Caps Based on DraftKings</Text>
            <Text style={styles.toggleText}>
              {showInstructions ? '▲ Show Less' : '▼ Show More'}
            </Text>
          </TouchableOpacity>
          
          {showInstructions && (
            <Text style={styles.headerDescription}>
              Choose players strategically while staying within your salary cap of {formatAbbreviated(SALARY_CAP)}. Each player has a unique cost, determined by their odds to win. Make sure to manage your selections wisely to maximize your roster strength without exceeding the cap.
            </Text>
          )}
        </View>

        <View style={styles.content}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'space-evenly', marginBottom: scale(30)}}>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{color: 'white', fontSize: scale(14), fontWeight: 'bold'}}>Remaining Salary</Text>
              <Text style={{color: 'white', fontSize: scale(14), }}>
                {formatAbbreviated(remainingSalary)}
              </Text>
            </View>

            <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{color: 'white', fontSize: scale(14), fontWeight: 'bold'}}>Avg/Player</Text>
              <Text style={{color: 'white', fontSize: scale(14), }}>
                ${Math.floor(averageSalary)}
              </Text>
            </View>
          </View>

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
                    {player || (currentlySelecting === index ? 'Selecting...' : 'Pick ' + (index + 1))}
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

          {currentlySelecting !== null && (
            <View style={styles.playerSelectionContainer}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search for a player"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
              />

              <View style={styles.playerList}>
                {filteredPlayers.map((player, index) => (
                  <View style={styles.playerCard} key={index}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => handleSelectPlayer(currentlySelecting, player.name)}
                    >
                      <Text style={styles.selectButtonText}>${PLAYER_COST}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#305115',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#305115',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerContainer: {
    marginTop: scale(25),
    padding: scale(10),
    backgroundColor: '#204010',
    borderRadius: 5,
    marginBottom: scale(10),
  },
  instructionsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#FFD700',
    flex: 1,
  },
  toggleText: {
    fontSize: scale(12),
    color: '#FFD700',
    fontWeight: '500',
  },
  headerDescription: {
    fontSize: scale(12),
    color: '#FFFFFF',
    marginTop: scale(10),
  },
  content: {
    alignSelf: 'center',
    marginTop: scale(10),
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: scale(15),
    textAlign: 'center',
  },
  remainingSalaryText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  salaryText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: '#f44336',
    borderRadius: 30,
    height: scale(15),
    width: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playerSelectionContainer: {
    marginTop: 10,
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
  playerScroll: {
    maxHeight: 400,
    marginTop: 10,
  },
  playerList: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 20,
  },
  playerCard: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
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
  },
  saveButton: {
    backgroundColor: '#ffdf00',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: scale(15),
    marginBottom: scale(10)
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
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});

export default SalaryCapPlayerPicks;