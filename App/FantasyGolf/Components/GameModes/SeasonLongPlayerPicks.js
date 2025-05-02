import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Modal, Dimensions } from 'react-native';
import { getDatabase, ref, get, onValue, update } from 'firebase/database';
import { app } from '../../config';
import { useUser } from '../../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scale } from 'react-native-size-matters';

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);
const iosWidth = Dimensions.get('window').width;

const SeasonLongPlayerPicks = () => {
  const { triggerScoreboardRefresh, selectedPool, setSelectedPool } = useUser();
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(["", "", "", "", "", "", "", ""]);
  const [currentlySelecting, setCurrentlySelecting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [username, setUsername] = useState('');
  const [pastPicksVisible, setPastPicksVisible] = useState(false);
  const [userPicks, setUserPicks] = useState([]);
  const [lockedPicks, setLockedPicks] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    return () => listener();
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
          user.pick6,
          user.alt1,
          user.alt2
        ];
        setSelectedPlayers(userPicks);
      }
    }
  }, [username, selectedPool]);

  useEffect(() => {
    const currentUser = Object.values(selectedPool?.users || {}).find(u => u.username === username);
    if (currentUser) {
      const pickHistory = currentUser.pickHistory || [];
      setUserPicks(pickHistory);
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
    setCurrentlySelecting(null);

    if (index < selectedPlayers.length - 1) {
      setCurrentlySelecting(index + 1);
    }

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
    const removedPlayer = selectedPlayers[index];
    const updatedPlayers = [...selectedPlayers];
    updatedPlayers[index] = "";
    setSelectedPlayers(updatedPlayers);

    setUserPicks((prevPicks) => {
      const newPickHistory = prevPicks.map((pick) => {
        if (pick.player === removedPlayer) {
          return { ...pick, used: pick.used - 1 };
        }
        return pick;
      });
      return newPickHistory;
    });
  };

  const isSaveButtonEnabled = selectedPlayers.every((player) => player !== "") && !lockedPicks;

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
    const poolName = selectedPool?.name;
    if (!username || !poolName) return;

    const db = getDatabase();

    try {
      const snapshot = await get(ref(db, 'pools'));
      if (!snapshot.exists()) return;

      const poolsObj = snapshot.val();
      const poolEntries = Object.entries(poolsObj);
      const foundPool = poolEntries.find(([_, pool]) => pool.name === poolName);

      if (!foundPool) return;

      const [poolKey, poolData] = foundPool;
      if (!poolData.users) return;

      const userEntries = Object.entries(poolData.users);
      const foundUser = userEntries.find(([_, user]) => user.username === username);
      if (!foundUser) return;

      const [userKey, userData] = foundUser;

      const updatedUser = {
        ...userData,
        pick1: selectedPlayers[0],
        pick2: selectedPlayers[1],
        pick3: selectedPlayers[2],
        pick4: selectedPlayers[3],
        pick5: selectedPlayers[4],
        pick6: selectedPlayers[5],
        alt1: selectedPlayers[6],
        alt2: selectedPlayers[7],
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
      triggerScoreboardRefresh();
    } catch (error) {
      console.error('Error saving picks: ', error);
      alert('Failed to save picks.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flex: 1, top: 50, alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.pastPicksButton}
          onPress={() => setPastPicksVisible(!pastPicksVisible)}
        >
          <Text style={styles.pastPicksButtonText}>Past Picks</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Season Long Picks</Text>
          <Text style={styles.headerDescription}>
            Each week, you’ll change your players and earn points based on their performance.Leaderboards update weekly, so consistency is key to building your season total.{"\n\n"}

            You can only pick each player a limited number of times, depending on your pool’s settings. Track your progress as the leaderboard updates.
          </Text>


        </View>

        <Modal
          visible={pastPicksVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPastPicksVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.pastPicksContainer}>
              <ScrollView>
                {userPicks.length === 0 ? (
                  <Text style={{ textAlign: 'center', fontSize: 16 }}>
                    You have no Past Picks yet
                  </Text>
                ) : (
                  userPicks
                    .sort((a, b) => b.used - a.used)
                    .map((pick, index) => (
                      <View key={index} style={styles.pastPickCard}>
                        <Text style={styles.pastPickPlayer}>{pick.player}</Text>
                        <Text style={styles.pastPickCount}>Picked {pick.used} times</Text>
                      </View>
                    ))
                )}
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
                    {player || (currentlySelecting === index ? 'Selecting...' : index < 6 ? `Pick ${index + 1}` : index === 6 ? 'Alternate 1' : 'Alternate 2')}
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
            <Text style={[styles.saveButtonText, !isSaveButtonEnabled && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>

          {currentlySelecting !== null && (
            <View style={{}}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search for a player"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <ScrollView contentContainerStyle={styles.playerList}>
                {filteredPlayers.map((player, index) => {
                  const pickCount = userPicks.find(pick => pick.player === player.name)?.used || 0;
                  const isDisabled = pickCount >= 4;

                  return (
                    <View style={styles.playerCard} key={index}>
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerOdds}>Odds: {player.odds_to_win}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.selectButton, isDisabled && styles.selectButtonDisabled]}
                        onPress={() => !isDisabled && handleSelectPlayer(currentlySelecting, player.name)}
                        disabled={isDisabled}
                      >
                        <Text style={styles.selectButtonText}>
                          Select {pickCount > 0 && `(${pickCount})`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#305115',
    height: isIos ? undefined : 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: scale(40),
    padding: scale(10),
    backgroundColor: '#204010',
    width: iosWidth
  },
  headerTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: scale(5),
  },
  headerDescription: {
    fontSize: scale(12),
    color: '#FFFFFF',
  },
  pastPicksButton: {
    position: 'absolute',
    left: 0,
    top: 0,
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
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeModalText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    alignSelf: 'center',
    top: scale(15),
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
  playerInfo: {
    flexDirection: 'column',
  },
  playerName: {
    fontSize: scale(14),
    color: 'black',
  },
  playerOdds: {
    fontSize: scale(12),
    color: 'gray',
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

export default SeasonLongPlayerPicks;
