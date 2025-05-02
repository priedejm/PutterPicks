import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { getDatabase, ref, get, update, onValue } from 'firebase/database';
import { app } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scale } from 'react-native-size-matters';

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const TieredPlayerPicks = ({ selectedPool, setSelectedPool }) => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [collapsedTiers, setCollapsedTiers] = useState({});
  const [username, setUsername] = useState('');
  const [lockedPicks, setLockedPicks] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const settings = selectedPool?.settings || {};
  const amountOfTiers = settings.amountOfTiers || 1;

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

  const sortedPlayers = [...players].sort((a, b) => parseInt(a.odds_to_win) - parseInt(b.odds_to_win));
  const playersPerTier = Math.ceil(sortedPlayers.length / amountOfTiers);
  const tiers = [];

  let index = 0;
  for (const player of sortedPlayers) {
    const tierIndex = Math.floor(index / playersPerTier);
    if (!tiers[tierIndex]) {
      tiers[tierIndex] = [];
    }
    tiers[tierIndex].push(player);
    index++;
  }

  const handleSelectPlayer = (tierIndex, playerName) => {
    if (lockedPicks) {
      alert('Picks are locked!');
      return;
    }
    const alreadySelected = selectedPlayers[tierIndex] === playerName;

    if (alreadySelected) {
      const updated = { ...selectedPlayers };
      delete updated[tierIndex];
      setSelectedPlayers(updated);

      setCollapsedTiers(prev => ({
        ...prev,
        [tierIndex]: false
      }));
    } else {
      setSelectedPlayers(prev => ({
        ...prev,
        [tierIndex]: playerName
      }));

      setCollapsedTiers(prev => ({
        ...prev,
        [tierIndex]: true
      }));
    }
  };

  const handleSave = async () => {
    if (!username || !selectedPool?.name) return;

    const db = getDatabase();

    try {
      const snapshot = await get(ref(db, 'pools'));
      if (!snapshot.exists()) return;

      const poolsObj = snapshot.val();
      const poolEntries = Object.entries(poolsObj);
      const foundPool = poolEntries.find(([_, pool]) => pool.name === selectedPool.name);

      if (!foundPool) return;

      const [poolKey, poolData] = foundPool;
      const userEntries = Object.entries(poolData.users || {});
      const foundUser = userEntries.find(([_, user]) => user.username === username);

      if (!foundUser) return;

      const [userKey, userData] = foundUser;
      const picks = Object.values(selectedPlayers);

      const updatedUser = {
        ...userData,
        pick1: picks[0] || '',
        pick2: picks[1] || '',
        pick3: picks[2] || '',
        pick4: picks[3] || '',
        pick5: picks[4] || '',
        pick6: picks[5] || ''
      };

      const userRef = ref(db, `pools/${poolKey}/users/${userKey}`);
      await update(userRef, updatedUser);

      const updatedUsers = { ...selectedPool.users, [userKey]: updatedUser };
      setSelectedPool({ ...selectedPool, users: updatedUsers });

      alert('Picks saved successfully!');
    } catch (error) {
      console.error('Error saving picks: ', error);
      alert('Failed to save picks.');
    }
  };

  const isSaveDisabled = Object.keys(selectedPlayers).length < amountOfTiers || lockedPicks;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Golf Tiers Based on DraftKings</Text>
        <Text style={styles.headerDescription}>
          Choose one golfer from each of the tiers, ranked from favorites to longshots based on betting odds.
          You can edit your picks until the first tee time — after that, selections are locked and can’t be changed.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {tiers.map((tierPlayers, tierIndex) => {
          const isCollapsed = collapsedTiers[tierIndex];
          const selectedName = selectedPlayers[tierIndex];

          return (
            <View key={tierIndex} style={styles.tierSection}>
              <Text style={styles.tierHeader}>Tier {tierIndex + 1}</Text>
              {isCollapsed && selectedName ? (
                <TouchableOpacity
                  style={[styles.playerCard, styles.selectedPlayerCard]}
                  onPress={() => handleSelectPlayer(tierIndex, selectedName)}
                >
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{selectedName}</Text>
                    <Text style={styles.playerOdds}>
                      Odds: {tierPlayers.find(p => p.name === selectedName)?.odds_to_win}
                    </Text>
                  </View>
                  <View    style={[
                          styles.selectButton,
                          styles.selectedButton
                        ]}>
                  <Text style={styles.selectButtonText}>Change</Text>
                      </View>
                </TouchableOpacity>
              ) : (
                tierPlayers.map((player, idx) => {
                  const isSelected = selectedName === player.name;
                  const isDisabled = selectedName && !isSelected;

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.playerCard,
                        isDisabled && styles.disabledPlayerCard
                      ]}
                    >
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerOdds}>Odds: {player.odds_to_win}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleSelectPlayer(tierIndex, player.name)}
                        disabled={isDisabled}
                        style={[
                          styles.selectButton,
                          isSelected && styles.selectedButton
                        ]}
                      >
                        <Text style={styles.selectButtonText}>
                          {isSelected ? 'Selected' : 'Select'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={{ width: '100%', backgroundColor: '#305115', height: scale(65) }}>
        <TouchableOpacity
          style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaveDisabled}
        >
          <Text style={styles.saveButtonText}>
            {isSaveDisabled ? 'Select All Tiers' : 'Save Picks'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#305115',
    paddingTop: scale(20),
  },
  scrollContainer: {
    paddingHorizontal: scale(10),
    paddingBottom: scale(100),
  },
  headerContainer: {
    marginTop: scale(25),
    padding: scale(10),
    backgroundColor: '#204010',
    marginBottom: scale(10),
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
  tierSection: {
    marginBottom: scale(20),
  },
  tierHeader: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: scale(10),
  },
  playerCard: {
    backgroundColor: 'white',
    padding: scale(10),
    marginBottom: scale(5),
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledPlayerCard: {
    backgroundColor: '#ccc',
  },
  selectedPlayerCard: {
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
    marginTop: scale(5),
    backgroundColor: '#007AFF',
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  selectButtonText: {
    color: 'white',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  saveButton: {
    position: 'absolute',
    bottom: scale(10),
    left: scale(10),
    right: scale(10),
    backgroundColor: '#ffdf00',
    padding: scale(12),
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    fontSize: scale(16),
    color: 'black',
  },
});

export default TieredPlayerPicks;
