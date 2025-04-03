import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../config';
import LoginScreen from './Login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import Slider from './Slider';
import SeasonLeaderboard from './SeasonLeaderboard';
import { MaterialIcons } from '@expo/vector-icons';  // For the checkmark icon


const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

// PGA Tour payout percentages for each position (from 1 to 65)
const payoutPercentages = [
  18.0, 10.9, 6.9, 4.9, 4.1, 3.625, 3.375, 3.125, 2.925, 2.725, 2.525, 2.325, 2.125,
  1.925, 1.825, 1.725, 1.625, 1.525, 1.425, 1.325, 1.225, 1.125, 1.045, 0.965, 0.885,
  0.805, 0.775, 0.745, 0.715, 0.685, 0.655, 0.625, 0.595, 0.57, 0.545, 0.52, 0.495,
  0.475, 0.455, 0.435, 0.415, 0.395, 0.375, 0.355, 0.335, 0.315, 0.295, 0.279, 0.265,
  0.257, 0.251, 0.245, 0.241, 0.237, 0.235, 0.233, 0.231, 0.229, 0.227, 0.225, 0.223,
  0.221, 0.219, 0.217, 0.215
];

const Scoreboard = ({ navigation }) => {
  const { refreshScoreboard, isLoggedIn } = useUser();
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [secretScoreboard, setSecretScoreboard] = useState(false);
  const [username, setUsername] = useState(null);
  const [active, setActive] = useState(true); 
  const [tournament, setTournament] = useState(null);

  useEffect(() => {
    const playersRef = ref(database, 'players/players');
    get(playersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setPlayers(Object.values(snapshot.val()));
      }
    }).catch((error) => {
      console.error(error);
    });
  }, [refreshScoreboard]);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      }
    }).catch((error) => {
      console.error(error);
    });
  }, [refreshScoreboard]);

  useEffect(() => {
    const featureFlagRef = ref(database, 'featureflags/secretScoreboard');
    get(featureFlagRef).then((snapshot) => {
      if (snapshot.exists()) {
        setSecretScoreboard(snapshot.val());
      }
    }).catch((error) => {
      console.error("Error fetching feature flag:", error);
    });
  }, []);

  useEffect(() => {
    const grabUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    grabUsername();
  }, []);

  useEffect(() => {
    const tournamentRef = ref(database, 'tournaments');
    get(tournamentRef).then((snapshot) => {
      if (snapshot.exists()) {
        setTournament(Object.values(snapshot.val())[0]);
      }
    }).catch((error) => {
      console.error("Error fetching tournament data:", error);
    });
  }, []);

  const getPlayerPosition = (playerName) => {
    const player = players.find(player => player.name === playerName);
    return player ? player.position : "N/A";
  };

  const getPlayerScore = (playerName, totalScore) => {
    const player = players.find(player => player.name === playerName);
    if (player) {
      const score = player.score;
      if (score === "E") return totalScore ? 0 : score;
      if (score.includes("+")) {
        return parseInt(score.replace("+", ""));
      }
      if (score.includes("-")) {
        return parseInt(score);
      }
      return score;
    }
    return "N/A";
  };

  const calculateTotalScore = (user) => {
    const totalScore = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6]
      .map(pick => pick ? getPlayerScore(pick, true) : 0)
      .reduce((total, score) => total + score, 0);
    return totalScore;
  };

  const calculateTotalWinnings = (user) => {
    const picks = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6];
    
    // Helper function to parse payouts
    const parsePayout = (payout) => {
      if (typeof payout === 'string') {
        return parseFloat(payout.replace(/,/g, '')); // Remove commas and parse as float
      }
      return payout; // If already a number, return it
    };
  
    // Helper function to format numbers into abbreviated format
    const abbreviateNumber = (num) => {
      if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'mil';  // Millions
      } else if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'k';      // Thousands
      } else {
        return num.toString();                     // Return number as is if less than 1k
      }
    };
  
    // Calculate the total payout by summing up the payouts for each pick
    const totalPayout = picks
      .map(pick => {
        const player = calculatePayouts().find(player => pick === player.name);
        const payout = player ? player.payout : 0;
        return parsePayout(payout);
      })
      .reduce((sum, payout) => sum + payout, 0); // Sum all the payouts
  
    return abbreviateNumber(totalPayout); // Abbreviate the total payout
  };
  

  const sortedUsers = [...users].sort((a, b) => calculateTotalScore(a) - calculateTotalScore(b));

  const calculatePayouts = () => {
    if (!tournament || !tournament.purse) return [];
  
    // Filter players who are not "CUT", "N/A", or have no valid score
    const playersPaid = players.filter(player => player.position !== 'CUT' && player.position !== 'N/A' && player.score !== '-');
    const payouts = [];
    let positionCounts = {};
  
    // Count how many players are tied at each position
    playersPaid.forEach(player => {
      let position = player.position.startsWith('T') ? parseInt(player.position.slice(1), 10) : parseInt(player.position, 10);
      positionCounts[position] = (positionCounts[position] || 0) + 1;
    });
  
    // Sort positions in ascending order (lowest position number comes first)
    const sortedPositions = Object.keys(positionCounts).map(Number).sort((a, b) => a - b);
  
    // Format number with commas
    const formatPayout = (amount) => {
      return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
  
    sortedPositions.forEach(position => {
      const tieCount = positionCounts[position];
      const payoutPercentageArray = [];
  
      // Collect payout percentages for tied positions
      for (let i = 0; i < tieCount; i++) {
        payoutPercentageArray.push(payoutPercentages[(position - 1) + i]);
      }
  
      // Calculate total payout for this position (for all players tied)
      let totalPayout = payoutPercentageArray.reduce((sum, percentage) => {
        return sum + (tournament.purse * percentage) / 100;
      }, 0);
  
      // Amount for each player in the tied position
      const amountForPlayer = totalPayout / tieCount;
  
      // Push payout information for each player
      playersPaid.filter(player => {
        let playerPosition = parseInt(player.position.replace('T', ''), 10);
        return playerPosition === position;
      }).forEach(player => {
        payouts.push({
          name: player.name,
          position: player.position,
          score: player.score,
          payout: formatPayout(amountForPlayer), // formatted with commas
        });
      });
    });
  
    return payouts;
  };

  // Log the golfers' leaderboard and payouts
  const logGolfersLeaderboard = () => {
    const payouts = calculatePayouts();
    console.log('Golfers Leaderboard and Payouts:');
    console.log('------------------------------------');
    payouts.forEach((player, index) => {
      console.log(`Position: ${player.position}, Name: ${player.name}, Score: ${player.score}, Payout: $${player.payout}`);
    });
  };
  const countPlayerPicks = () => {
    const pickCounts = {};
  
    // Count how many times each player is picked by users
    users.forEach(user => {
      [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].forEach(pick => {
        if (pick) {
          pickCounts[pick] = (pickCounts[pick] || 0) + 1;
        }
      });
    });
  
    console.log("pick counts are", pickCounts);
    
    // Create an array of players with their pick counts
    const playersWithCounts = Object.keys(pickCounts).map(playerName => ({
      name: playerName,
      count: pickCounts[playerName],
    }));
  
    // Sort players by pick count in descending order
    playersWithCounts.sort((a, b) => b.count - a.count);
  
    // Calculate the total number of picks
    const totalPicks = Object.values(pickCounts).reduce((total, count) => total + count, 0);
  
    // Calculate percentages for top 3 players
    const topPlayers = playersWithCounts.slice(0, 3).map(player => ({
      name: player.name,
      count: player.count,
      percentage: ((player.count / totalPicks) * 100).toFixed(1),
    }));
  
    return topPlayers;
  };
  
  

  // Get top 3 picked players
  const top3Players = countPlayerPicks();

  console.log("top 3 is ", top3Players)

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{alignSelf: 'center'}}>
          <Slider 
            active={active} 
            onSelectTournamentScoreboard={() => setActive(true)} 
            onSelectSeasonalScoreboard={() => setActive(false)} 
          />
        </View>
          {(tournament && active) && (
            <View style={styles.tournamentHeader}>
              <Text style={styles.tournamentName}>{tournament.name}</Text>
              <Text style={styles.tournamentDetails}>
                Purse: ${tournament.purse.toLocaleString()} | Year: {tournament.year}
              </Text>
            </View>
          )}
          {/* Top 3 Players with Percentages */}
          {(active && !secretScoreboard)&&
          <View style={styles.topPlayersContainer}>
            <Text style={{textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: 'white'}}>Top 3 Most Picked</Text>
            {top3Players.map((player, index) => (
              <Text key={index} style={styles.topPlayer}>
                {index + 1}. {player.name} - {player.percentage}%
              </Text>
            ))}
          </View>}
            
          {!active ? 
            <SeasonLeaderboard/> 
            : 
            sortedUsers.map((user, index) => {
              const totalScore = calculateTotalScore(user);
              const totalWinnings = calculateTotalWinnings(user);
              const isLoggedInUser = username === user.username;
              const allPicksChosen = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(pick => pick);

              return (
                <View style={{ width: '100%', backgroundColor: '#45751e' }} key={index}>
                  <View style={styles.playerCard}>
                    <View style={styles.headerRow}>
                      <Text style={styles.position}>Pos</Text>
                      <Text style={styles.playerName}></Text>
                      <Text style={styles.totalScore}>Total</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.position}>{index + 1}</Text>
                      <Text style={styles.playerName}>{user.username}</Text>
                      <Text style={styles.totalScore}>{secretScoreboard && isLoggedInUser ? `${totalScore} | ${totalWinnings}` : null}</Text>
                    </View>
                    <View style={styles.picksWrapper}>
                      {[user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].map((pick, i) => (
                        <View style={styles.picksRow} key={i + 100}>
                          <Text style={styles.pickLabel}>{getPlayerPosition(pick)}:</Text>
                          <Text style={styles.pickValue}>
                            {(!pick && !secretScoreboard && !isLoggedInUser) && 'Pick'}{" "}
                            {(!pick && isLoggedInUser) && 'Pick'}
                            {secretScoreboard && !isLoggedInUser ? '?' : pick} {"|"} {getPlayerScore(pick)}
                          </Text>
                          <Text style={styles.pickScore}>
                            {secretScoreboard && !isLoggedInUser ? '?' : '$' + (calculatePayouts().find(player => pick === player.name)?.payout === undefined ? 0 : calculatePayouts().find(player => pick === player.name)?.payout)}{" "}
                          </Text>
                        </View>
                      ))}
                      {(secretScoreboard && !isLoggedInUser) && <View style={{backgroundColor: 'white', position: 'absolute', height: '105%', width: '100%', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 72, bottom: 20}}>?</Text>
                      </View>}
                    </View>
                    {(allPicksChosen && secretScoreboard) && (
                    <View style={styles.checkmarkWrapper}>
                      <MaterialIcons name="check-circle" size={24} color="green" style={styles.checkmark} />
                    </View>
                  )}
                  </View>
                </View>
              );
            })
          }

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#45751e',
    paddingVertical: 10,
    alignItems: 'center',
    height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web
  },
  scoreboardContainer: {
    width: 375,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
  },
  scoreboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#45751e',
    marginBottom: 20,
  },
  playerRow: {
    marginBottom: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  playerRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#45751e',
  },
  scrollView: {
    width: '100%',
    padding: 20,
  },
  tournamentHeader: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: 375,
  },
  tournamentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#45751e',
  },
  tournamentDetails: {
    fontSize: 18,
    color: '#45751e',
    marginTop: 5,
  },
  playerCard: {
    width: 360, // Widened card
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'column', // Stack vertically for wider layout
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  position: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#45751e',
    width: '25%',
    textAlign: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#45751e',
    width: '40%',
    textAlign: 'center',
    bottom: 20
  },
  totalScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#45751e',
    width: '35%',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  picksWrapper: {
    width: '100%',
    paddingTop: 10,
  },
  picksRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 5, // Space between pick rows
  },
  pickLabel: {
    width: '15%',
    fontSize: 16,
    color: '#45751e',
  },
  pickValue: {
    width: '55%',
    fontSize: 16,
    color: '#45751e',
  },
  pickScore: {
    width: '30%',
    fontSize: 16,
    color: '#45751e',
    textAlign: 'center',
  },
  topPlayersContainer: {  
    marginBottom: 20
  },
  topPlayer: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold'
  },  
  checkmarkWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  checkmark: {
    fontSize: 30,
  },
});

export default Scoreboard;