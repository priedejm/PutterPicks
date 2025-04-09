import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, RefreshControl } from 'react-native';
import { getDatabase, ref, get } from "firebase/database"; 
import { app } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from './Login';
import CountryFlag from 'react-native-country-flag';
import { countryCodeMap } from '../utils/countryCodeMap'; // Import the country code map
import { useUser } from '../context/UserContext'; // Import the UserContext
import PlayerCard from './PlayerCard';

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
const isIos = Platform.OS === 'ios';

const Leaderboard = () => {
  const { triggerScoreboardRefresh } = useUser();
  const [players, setPlayers] = useState([]); 
  const [tournament, setTournament] = useState(null); // State for storing tournament info
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
  const [username, setUsername] = useState(); // State for pull-to-refresh
  const [user, setUser] = useState(); // State for pull-to-refresh
  const [users, setUsers] = useState();
  useEffect(() => {
    const grabUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    grabUsername();
  }, []);

  // // Create a mapping for the player's earnings
  // const playerEarnings = {
  //   Justin: 8336818,
  //   Davis: 7892738,
  //   Connor: 7560706,
  //   Cameron: 7223939,
  //   Greg: 6978150,
  //   Henry: 5172531,
  //   Jack: 4020440,
  //   Tyler: 3895531,
  //   Charlie: 3113016,
  //   Wesley: 2454679,
  //   tom: 1687429,
  //   Landon: 768488,
  // };

  // useEffect(() => {
  //   const updateUsersSeasonWinnings = async () => {
  //     // Reference to the users in the database
  //     const usersRef = ref(database, 'users');
  //     get(usersRef).then((snapshot) => {
  //       if (snapshot.exists()) {
  //         const users = snapshot.val(); // Get all users

  //         // Iterate over each user and update their 'seasonWinnings' field
  //         Object.keys(users).forEach((key) => {
  //           const user = users[key];
            
  //           // Check if the username exists in the playerEarnings map
  //           if (playerEarnings[user.username]) {
  //             // Update the user with their earnings from the mapping
  //             const userRef = ref(database, users/${key});
  //             update(userRef, {
  //               seasonWinnings: playerEarnings[user.username], // Use earnings from mapping
  //             }).then(() => {
  //               console.log(Updated seasonWinnings for ${user.username});
  //             }).catch((error) => {
  //               console.error(Error updating ${user.username}:, error);
  //             });
  //           }
  //         });
  //       } else {
  //         console.log("No data available in 'users'");
  //       }
  //     }).catch((error) => {
  //       console.error("Error fetching users:", error);
  //     });
  //   };

  //   // Call the function to update users' seasonWinnings
  //   updateUsersSeasonWinnings();
  // }, []); // Empty dependency array to run only once when the component mounts

  useEffect(() => {
    if(!username) return;
    fetchPlayers();
    fetchTournament();
  }, [username]);

  const fetchPlayers = async (fromRefresh) => {
    console.log("fetching");
    const playersRef = ref(database, 'players/players');
    try {
      const usersSnapshot = await get(ref(database, 'users'));
      const snapshot = await get(playersRef);
  
      if (snapshot.exists()) {
        console.log("new players fetched");
        setPlayers(Object.values(snapshot.val())); 
  
        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
  
          // Find the user with the matching username
          const foundUser = Object.values(users).find(user => user.username === username);
  
          if (foundUser) {
            // Set the found user to the context or state
            setUser(foundUser);  // Assuming you have a setUser function in context or state
          }
        }
        if(fromRefresh) triggerScoreboardRefresh();
      } else {
        console.log("No data available");
      }
    } catch (error) {
      console.error(error);
    }
  };
  

  // Function to fetch tournament info from the Firebase database
  const fetchTournament = async () => {
    const tournamentRef = ref(database, 'tournaments');
    try {
      const snapshot = await get(tournamentRef);
      if (snapshot.exists()) {
        setTournament(Object.values(snapshot.val())[0]);
      }
    } catch (error) {
      console.error("Error fetching tournament data:", error);
    }
  };

  // Function to handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPlayers(true);
    fetchTournament();
    setRefreshing(false);
  };

  const getIsoCode = (countryCode) => {
    if (!countryCode) return;
    return countryCodeMap[countryCode] || countryCode.toLowerCase();
  };

  const renderPlayers = () => {
    return players.map((item, index) => {
      let country = getIsoCode(item.country);
      const displayedRounds = Array.isArray(item?.rounds) ? item.rounds.slice(0, 3) : [];

      return (
        <View style={styles.row} key={index}>
          <View style={{ justifyContent: 'center', alignItems: 'center', flex: 0.8,}}>
            <Text style={[styles.cell]}>{item.position || "N/A"}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 3 }}>
            <CountryFlag isoCode={country} size={15} />
            <Text style={styles.playerCell} numberOfLines={1}>{item.name || "Unknown"}</Text>
          </View>
          <View style={{ justifyContent: 'center', alignItems: 'center', flex: 0.8, flexDirection: 'row'}}>
            <Text style={[styles.cell, styles.scoreCell]}>{item.score || "0"}</Text>
          </View>
          <View style={{ justifyContent: 'center', alignItems: 'center', width: item?.thru_status.includes(":") ? '20%' : '10%', flexDirection: 'row'}}>
            <Text style={[styles.cell, styles.thruCell]}>{item.thru_status || "N/A"}</Text>
          </View>
          <Text style={styles.roundsCell}>{displayedRounds.length > 0 ? displayedRounds.join(', ') : "No rounds"}</Text>
        </View>
      );
    });
  };

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
    if(!user) return;
    const totalScore = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6]
      .map(pick => pick ? getPlayerScore(pick, true) : 0)
      .reduce((total, score) => total + score, 0);
    return totalScore;
  };

    const calculateTotalWinnings = (user) => {
      if(!user) return;
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

  const abbreviateNumber = (num) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'mil';  // Millions
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'k';      // Thousands
    } else {
      return num.toString();                     // Return number as is if less than 1k
    }
  };
  
  const calculatePayouts = () => {
    if (!tournament || !tournament.purse) return [];
  
    // Filter players who are not "CUT", "N/A", or have no valid score
    const playersPaid = players.filter(player => player.position !== 'CUT' && player.position !== 'N/A' && player.score !== '-');
    
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
  
    // Format number with commas
    const formatPayout = (amount) => amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
    const payouts = [];
    
    // Iterate over sorted positions and calculate payouts for tied players
    sortedPositions.forEach(position => {
      const { count, players } = positionCounts[position];
      const payoutPercentageArray = payoutPercentages.slice(position - 1, position - 1 + count);
    
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
          payout: String(payout) === 'NaN' ? '0.00' : payout, // formatted with commas
        });
      });
    });
  
    return payouts;
  };
  

  const totalScore = calculateTotalScore(user);
  const totalWinnings = calculateTotalWinnings(user);
  console.log("heller", totalWinnings)
  return (
    <View style={styles.wrapper}>
      <View style={{ flex: 1, backgroundColor: '#18453B', top: 50, overflow: 'visible' }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={isIos ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : null}
      >
        <View style={{flex: 1, top: 50, alignItems: 'center'}}>
          {/* Display Tournament Info at the top */}
          {tournament && (
            <View style={styles.tournamentHeader}>
              <Text style={styles.tournamentName}>{tournament.name}</Text>
              <Text style={styles.tournamentDetails}>
                Purse: ${tournament.purse.toLocaleString()} | Year: {tournament.year}
              </Text>
            </View>
          )}
          {user && 
          <View style={{bottom: 40, }}>
          <PlayerCard
              personalCard={true}
              user={user}
              totalScore={totalScore}
              totalWinnings={totalWinnings}
              isLoggedInUser={true}
              secretScoreboard={false}
              getPlayerPosition={getPlayerPosition}
              getPlayerScore={getPlayerScore}
              calculatePayouts={calculatePayouts}
              getPlayerThruStatus={getPlayerThruStatus}
              abbreviateNumber={abbreviateNumber}
            />
            </View>}

          <View style={{ width: 370, maxWidth: 500, alignSelf: 'center' , bottom: 40,}}>
            <View style={styles.header}>
              <Text style={[styles.headerText, styles.posHeader]}>Pos</Text>
              <Text style={[styles.headerText, styles.playerHeader]}>Player</Text>
              <Text style={[styles.headerText, styles.scoreHeader]}>Score</Text>
              <Text style={[styles.headerText, styles.thruHeader]}>Thru</Text>
              <Text style={[styles.headerText, styles.roundsHeader]}>Rounds</Text>
            </View>

            {renderPlayers()} {/* Calling the renderPlayers function */}
          </View>
        </View>
      </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#18453B',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 8,
  },
  container: {
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web
  },
  tournamentHeader: {
    backgroundColor: '#fff',
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 30,
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: 375,
    bottom: 40,
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
  header: {
    flexDirection: 'row',
    backgroundColor: '#18453B',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 8,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  posHeader: {
    flex: 0.8,
  },
  playerHeader: {
    flex: 3.2,
    textAlign: 'left',
  },
  scoreHeader: {
    flex: 1.2,
  },
  thruHeader: {
    flex: 1,
  },
  roundsHeader: {
    flex: 2,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    paddingVertical: 20,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cell: {
    fontSize: 14,
    color: '#18453B',
    textAlign: 'center',
  },
  posCell: {
    flex: 0.8,
  },
  playerCell: {
    fontSize: 14,
    color: '#18453B',
    textAlign: 'left',
    flex: 3.2,
    marginLeft: 5,
  },
  scoreCell: {
    flex: 1.2,
  },
  thruCell: {
    flex: 1,
  },
  roundsCell: {
    flex: 2,
    fontSize: 14,
    color: '#18453B',
    textAlign: 'center',
  },
});

export default Leaderboard;
