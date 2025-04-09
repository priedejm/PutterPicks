import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, Image, } from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../config';
import LoginScreen from './Login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import Slider from './Slider';
import SeasonLeaderboard from './SeasonLeaderboard';
import { MaterialIcons } from '@expo/vector-icons';  // For the checkmark icon
import PlayerCard from './PlayerCard';


const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

// PGA Tour payout percentages for each position (from 1 to 65)
// const payoutPercentages = [
//   18.0, 10.9, 6.9, 4.9, 4.1, 3.625, 3.375, 3.125, 2.925, 2.725, 2.525, 2.325, 2.125,
//   1.925, 1.825, 1.725, 1.625, 1.525, 1.425, 1.325, 1.225, 1.125, 1.045, 0.965, 0.885,
//   0.805, 0.775, 0.745, 0.715, 0.685, 0.655, 0.625, 0.595, 0.57, 0.545, 0.52, 0.495,
//   0.475, 0.455, 0.435, 0.415, 0.395, 0.375, 0.355, 0.335, 0.315, 0.295, 0.279, 0.265,
//   0.257, 0.251, 0.245, 0.241, 0.237, 0.235, 0.233, 0.231, 0.229, 0.227, 0.225, 0.223,
//   0.221, 0.219, 0.217, 0.215
// ];

const amateurPlayers = [
  'Ben James',
  'Hiroshi Tai',
  'Jose Luis Ballester',
  'Noah Kent',
  'Justin Hastings',
  'Evan Beck'
]

// masters percentages
const payoutPercentages = [
  18.0, 10.8, 6.8, 4.8, 4.0, 3.6, 3.35, 3.1, 2.9, 2.7, 2.5, 2.3, 2.1,
  1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.12, 1.04, 0.96, 0.88,
  0.8, 0.77, 0.74, 0.71, 0.68, 0.65, 0.62, 0.59, 0.57, 0.54, 0.52, 0.49,
  0.47, 0.45, 0.43, 0.41, 0.39, 0.37, 0.35, 0.33, 0.31, 0.29, 0.274, 0.26,
  0.252, 0.246, 0.24, 0.236, 0.232, 0.228, 0.224, 0.22, 0.216, 0.212, 0.208
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
    const fetchData = async () => {
      try {
        const playersSnapshot = await get(ref(database, 'players/players'));
        const usersSnapshot = await get(ref(database, 'users'));
        const featureFlagSnapshot = await get(ref(database, 'featureflags/secretScoreboard'));
        const tournamentSnapshot = await get(ref(database, 'tournaments'));
        if (playersSnapshot.exists()) setPlayers(Object.values(playersSnapshot.val()));
        if (usersSnapshot.exists()) setUsers(usersSnapshot.val());
        if (featureFlagSnapshot.exists()) setSecretScoreboard(featureFlagSnapshot.val());
        if (tournamentSnapshot.exists()) setTournament(Object.values(tournamentSnapshot.val())[1]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, [refreshScoreboard]);

  useEffect(() => {
    const grabUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    grabUsername();
  }, []);


  const getPlayerPosition = (playerName) => {
    const player = players.find(player => player.name === playerName);
    return player ? player.position : "N/A";
  };

  const getPlayerThruStatus = (playerName) => {
    const player = players.find(player => player.name === playerName);
    return player ? player.thru_status : "N/A";
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


  const abbreviateNumber = (num) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'mil';  // Millions
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'k';      // Thousands
    } else {
      return num.toString();                     // Return number as is if less than 1k
    }
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
  
    // Calculate the total payout by summing up the payouts for each pick
    const totalPayout = picks
      .map(pick => {
        const player = calculatePayouts().find(player => pick === player.name);
        const payout = player ? player.payout : 0;
        return parsePayout(payout);
      })
      .reduce((sum, payout) => sum + payout, 0); // Sum all the payouts
    
    return totalPayout; // Abbreviate the total payout
  };
  
  // Update the `calculatePayouts` function to exclude amateur players
  
  const calculatePayouts = () => {
    if (!tournament || !tournament.purse) return [];
  
    // Filter players who are not amateurs and have a valid position and score
    const playersPaid = players
      .filter(player => !amateurPlayers.includes(player.name) && player.position !== 'CUT' && player.position !== 'N/A' && player.score !== '-');
  
    // Create a position to player mapping, and count how many players are tied at each position
    const positionCounts = {};
    playersPaid.forEach(player => {
      let position = player.position.startsWith('T') ? parseInt(player.position.slice(1), 10) : parseInt(player.position, 10);
      if (!positionCounts[position]) {
        positionCounts[position] = { count: 0, players: [] };
      }
      positionCounts[position].count += 1;
      positionCounts[position].players.push(player);
    });
  
    // Sort positions in ascending order (lowest position number comes first)
    const sortedPositions = Object.keys(positionCounts).map(Number).sort((a, b) => a - b);
  
    // Format number with commas, rounding to the nearest integer
    const formatPayout = (amount) => {
      const roundedAmount = Math.round(amount);  // Round to the nearest integer
      return roundedAmount.toLocaleString('en-US'); // Format with commas
    };
  
    const payouts = [];
  
    // Iterate over sorted positions and calculate payouts for tied players
    let adjustedPosition = 1; // To track the adjusted position
    sortedPositions.forEach(position => {
      const { count, players } = positionCounts[position];
      const payoutPercentageArray = payoutPercentages.slice(adjustedPosition - 1, adjustedPosition - 1 + count);
  
      // Calculate total payout for this position (for all players tied)
      const totalPayout = payoutPercentageArray.reduce((sum, percentage) => {
        return sum + (tournament.purse * percentage) / 100;
      }, 0);
  
      // Amount for each player in the tied position
      const amountForPlayer = totalPayout / count;
  
      // Push payout information for each player
      players.forEach(player => {
        const payout = formatPayout(amountForPlayer);
        payouts.push({
          name: player.name,
          position: player.position,
          score: player.score,
          payout: String(payout) === 'NaN' ? '0' : payout, // formatted with commas, 'NaN' handling
        });
      });
  
      adjustedPosition += count; // Increment the adjusted position by the count of players in the current tied position
    });
  
    return payouts;
  };
  
  

  // const logGolfersLeaderboardAndUsersPicks = () => {
  //   const payouts = useMemo(() => calculatePayouts(), [players, tournament]);
  //   //console.log("are these siething", payouts)
  //   // Log golfers' leaderboard and payouts
  //   //console.log('Golfers Leaderboard and Payouts:');
  //   //console.log('------------------------------------');
  //   payouts.forEach((player, index) => {
  //     //console.log(`Position: ${player.position}, Name: ${player.name}, Score: ${player.score}, Payout: $${player.payout}`);
  //   });
  
  //   // Log users' picks and their payouts
  //   //console.log('Users and Their Picks with Payouts:');
  //   //console.log('------------------------------------');
  //   users.forEach((user) => {
  //     const picks = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6];
  //     const userPayout = picks
  //       .map(pick => {
  //         const player = payouts.find(p => p.name === pick);
  //         return player ? player.payout : '0.00'; // If player is not found, default payout is 0.00
  //       })
  //       .reduce((sum, payout) => sum + parseFloat(payout), 0); // Calculate total payout for the user
  
  //     //console.log(`Username: ${user.username}, Total Payout: $${userPayout.toFixed(2)}`);
  //     picks.forEach((pick, idx) => {
  //       const player = payouts.find(p => p.name === pick); // Find the player object in payouts
      
  //       // Check if the player was found
  //       const payout = player ? player.payout : '0.00'; // If player exists, use their payout, otherwise use '0.00'
      
  //       //console.log(`  Pick ${idx + 1}: ${pick} (Payout: $${payout})`);
  //     });
      
  //   });
  // };
  
  // // Call the function to log golfers' leaderboard and user picks
  // logGolfersLeaderboardAndUsersPicks();
  
  const countPlayerPicks = () => {
    const pickCounts = {};
  
    // Count how many different users picked each player
    users.forEach(user => {
      const userPicks = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6];
  
      userPicks.forEach(pick => {
        if (pick && !pickCounts[pick]) {
          // Mark the player as picked by this user to avoid double counting for the same user
          pickCounts[pick] = new Set();
        }
        if (pick) {
          pickCounts[pick].add(user.username); // Track by username to ensure unique user counts
        }
      });
    });
  
    // Create an array of players with their pick counts (based on unique users)
    const playersWithCounts = Object.keys(pickCounts).map(playerName => ({
      name: playerName,
      count: pickCounts[playerName].size, // The size of the Set is the number of unique users who picked this player
    }));
  
    // Sort players by pick count in descending order
    playersWithCounts.sort((a, b) => b.count - a.count);
  
    // Calculate percentages based on the total number of users (12)
    const totalUsers = 12; // assuming 12 users as stated
    const topPlayers = playersWithCounts.slice(0, 3).map(player => ({
      name: player.name,
      count: player.count,
      percentage: ((player.count / totalUsers) * 100).toFixed(1), // Percentage of users who picked this player
    }));
  
    return topPlayers;
  };  
  


  // Get top 3 picked players
  const top3Players = countPlayerPicks();

  //console.log("top 3 is ", top3Players)

  if (!isLoggedIn) {
    return <LoginScreen />;
  }
  
  
  const sortedUsers = [...users]
  .filter(user => [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(pick => pick))
  .sort((a, b) => calculateTotalWinnings(b) - calculateTotalWinnings(a)); 
  
  const unsortedUsers = [...users]
  .filter(user => ![user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(pick => pick));
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{flex: 1, top: 50, alignItems: 'center'}}>
      <View style={{marginBottom: 20}}>
         <Slider onSelectTournamentScoreboard={() => setActive(true)}  onSelectSeasonalScoreboard={() => setActive(false)} active={active}/>
      </View>
      {(tournament && active) && (
        <View style={styles.tournamentHeader}>
          <Image
            source={require('../assets/mastersLogo.png')}
            style={{ width: 175, height: 35, marginBottom: 10 }}
          />
          {/* <Text style={styles.tournamentName}>{tournament.name}</Text> */}
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
        <SeasonLeaderboard /> 
        : 
        [...sortedUsers,... unsortedUsers].map((user, index) => {
          const totalScore = calculateTotalScore(user);
          const totalWinnings = abbreviateNumber(calculateTotalWinnings(user));
          const isLoggedInUser = username === user.username;
          const allPicksChosen = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(pick => pick);
  
          return <PlayerCard 
          key={index}
          user={user} 
          index={index} 
          totalScore={totalScore} 
          totalWinnings={totalWinnings} 
          isLoggedInUser={isLoggedInUser} 
          secretScoreboard={secretScoreboard}
          getPlayerScore={getPlayerScore}
          getPlayerPosition={getPlayerPosition}
          getPlayerThruStatus={getPlayerThruStatus}
          calculatePayouts={calculatePayouts}
          />
        })}
        </View>
    </ScrollView>
  );  
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#18453B',
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
    color: '#18453B',
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
    color: '#18453B',
  },
  scrollView: {
    width: '100%',
    padding: 20,
  },
  tournamentHeader: {
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
    color: '#18453B',
  },
  tournamentDetails: {
    fontSize: 16,
    color: '#18453B',
  },
  playerCard: {
    width: 375, // Widened card
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
    color: '#18453B',
    width: '25%',
    textAlign: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18453B',
    width: '40%',
    textAlign: 'center',
    bottom: 20
  },
  totalScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18453B',
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
    color: '#18453B',
  },
  pickValue: {
    width: '55%',
    fontSize: 16,
    color: '#18453B',
  },
  pickScore: {
    width: '30%',
    fontSize: 16,
    color: '#18453B',
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