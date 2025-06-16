import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, Image, TouchableOpacity, } from 'react-native';
import { getDatabase, ref, get, onValue } from 'firebase/database';
import { app } from '../config';
import LoginScreen from './Login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import Slider from './Slider';
import SeasonLeaderboard from './SeasonLeaderboard';
import { MaterialIcons } from '@expo/vector-icons';  // For the checkmark icon
import PlayerCard from './PlayerCard';
import { calculatePayouts } from '../utils/utilFunctions';
import { useNavigation } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { scale } from 'react-native-size-matters';


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;



const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const Scoreboard = () => {
  const navigation = useNavigation();
  const { refreshScoreboard, selectedPool } = useUser();
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);
  const latestTournament = selectedPool.tournaments[selectedPool.tournaments.length - 1];

  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [secretScoreboard, setSecretScoreboard] = useState(false);
  const [username, setUsername] = useState(null);
  const [active, setActive] = useState(true); 
  const [tournament, setTournament] = useState(latestTournament); // State for storing tournament info
  const [payoutPercentages, setPayoutPercentages] = useState([]);
  const [amateurPlayers, setAmateurPlayers] = useState([]);
  const [specialPayout, setSpecialPayout] = useState();
  const [cutLine, setCutLine] = useState();
  const [showProjectedCut, setShowProjectedCut] = useState(false);
  const [sortedUsers, setSortedUsers] = useState([]);
  const [unsortedUsers, setUnsortedUsers] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  useEffect(() => {
    const grabUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setIsLoggedIn(true);
      }
    };
    grabUsername();
  }, []);


  useEffect(() => {
    if (!username) return;
    const playersRef = ref(database, 'players/players');
  
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlayers(Object.values(snapshot.val()));
      }
    });

  
    return () => {
      unsubscribePlayers();
    };
  }, [username, refreshScoreboard]);
  

  useEffect(() => {
    if(players?.length < 1) return;
    console.log("whats this look like now", selectedPool)
    const fetchData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername && selectedPool?.users) {
          setUsername(storedUsername);
          const matchedUser = selectedPool.users.find(user => user.username === storedUsername);
        }
        
        setUsers(selectedPool?.users)
        const amateurSnapshot = await get(ref(database, 'amateurPlayers'));
        const payoutSnapshot = await get(ref(database, 'payoutPercentages'));
        if (amateurSnapshot.exists()) setAmateurPlayers(Object.values(amateurSnapshot.val()));
        if (payoutSnapshot.exists()) setPayoutPercentages(Object.values(payoutSnapshot.val()));

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [ players, selectedPool]);

  useEffect(()=> {
    if (!tournament || !tournament.purse) return;
    if (!Array.isArray(players) || players.length === 0) return;
    if (!Array.isArray(amateurPlayers)) return;
    if (!Array.isArray(payoutPercentages) || payoutPercentages.length === 0) return;
    if (!specialPayout) return;
    const fullyPicked = users.filter(user => [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(Boolean));
    const notFullyPicked = users.filter(user => ![user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(Boolean));
    console.log("fullyPicked", fullyPicked)
    console.log("notFullyPicked", notFullyPicked)
    const results = fullyPicked.map(user => {
      const winnings = calculateTotalWinnings(user);
      console.log(`User: ${user.username || user.id} | Winnings: ${winnings}`);
      return { user, winnings };
    });
    console.log("what are the results", results)
    const sorted = results.sort((a, b) => b.winnings - a.winnings);

     console.log("what are the sorted", sorted)
    setSortedUsers(sorted)
    setUnsortedUsers(notFullyPicked);
    console.log("each part of sorted iss", sorted)
  },[users, tournament, players, amateurPlayers, payoutPercentages, specialPayout, refreshScoreboard]);

  useEffect(() => {
    const secretRef = ref(database, 'featureflags/secretScoreboard');
    const unsubscribe = onValue(secretRef, (snapshot) => {
      if (snapshot.exists()) {
        setSecretScoreboard(snapshot.val());
      }
    });
  
    // Cleanup on unmount
    return () => unsubscribe(); // unsubscribe is a no-op for onValue, but useful if you use off()
  }, []);


  useEffect(() => {
    setShowProjectedCut(isProjectedCutLineVisible());
  }, []);  

  useEffect(() => {
    const specialPayoutRef = ref(database, 'featureflags/specialPayout');
    const unsubscribe = onValue(specialPayoutRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSpecialPayout(data); // this should now be a map of players
      }
    });
  
    return () => unsubscribe();
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
    if(players?.length < 1 || payoutPercentages?.length < 1) return;
    //console.log("array length", payoutPercentages?.length)
    //console.log("this is the 50th player", players[payoutPercentages?.length-1])
    setCutLine(players[payoutPercentages?.length-1]?.score)
  }, [players, payoutPercentages])


  const getPlayerPosition = (playerName) => {
    const player = players.find(player => player.name === playerName);
    return player ? player.position : "N/A";
  };

  const getPlayerRoundScore = (playerName) => {
    const player = players.find(player => player.name === playerName);
    const roundScore = player?.round;
    return roundScore != null && roundScore !== '' ? roundScore : 'E';
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

  const calculateTotalScore = useCallback((user) => {
    // console.log("calculating total score")
    console.log("whats the user like", user)
    const totalScore = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6]
      .map(pick => {
        const score = pick ? getPlayerScore(pick, true) : 0;
        return typeof score === 'number' ? score : 0; // Handle 'N/A' or invalid values
      })
      .reduce((total, score) => total + score, 0);
  
    return totalScore;
  }, [players]);
  

  const abbreviateNumber = (num) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'mil';  // Millions
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'k';      // Thousands
    } else {
      return num.toString();                     // Return number as is if less than 1k
    }
  };

  // Helper function to parse payouts
  const parsePayout = (payout) => {
    if (typeof payout === 'string') {
      return parseFloat(payout.replace(/,/g, '')); // Remove commas and parse as float
    }
    return payout; // If already a number, return it
  };

  function calculatePayoutsWrapper() {
    // console.log("calculating payouts")
    return calculatePayouts(tournament,players,amateurPlayers,payoutPercentages,specialPayout);
  }
    

  const calculateTotalWinnings = (user) => {
    // console.log("calculating total winnings")
    const picks = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6];
  
    // Calculate the total payout by summing up the payouts for each pick
    const totalPayout = picks
      .map(pick => {
        const player = calculatePayoutsWrapper().find(player => pick === player.name);
        const payout = player ? player.payout : 0;
        return parsePayout(payout);
      })
      .reduce((sum, payout) => sum + payout, 0); // Sum all the payouts
    
    return totalPayout === 'N/A' ? 0 : totalPayout; ; // Abbreviate the total payout
  };
  
  const logGolfersLeaderboardAndUsersPicks = () => {
    const payouts = useMemo(() => calculatePayoutsWrapper(), [players, tournament]);
    console.log("are these siething", payouts)
    // Log golfers' leaderboard and payouts
    console.log('Golfers Leaderboard and Payouts:');
    console.log('------------------------------------');
    payouts.forEach((player, index) => {
      console.log(`Position: ${player.position}, Name: ${player.name}, Score: ${player.score}, Thru: ${player.thru_status}, Payout: $${player.payout}`);
    });
  
    // Log users' picks and their payouts
    console.log('Users and Their Picks with Payouts:');
    console.log('------------------------------------');
    users.forEach((user) => {
      const picks = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6];
      const totalPayout = picks
      .map(pick => {
        const player = calculatePayoutsWrapper().find(player => pick === player.name);
        const payout = player ? player.payout : 0;
        return parsePayout(payout);
      })
      .reduce((sum, payout) => sum + payout, 0); // Sum all the payouts
  
      console.log(`Username: ${user.username}, Total Payout: $${totalPayout.toFixed(2)}`);
      picks.forEach((pick, idx) => {
        const player = payouts.find(p => p.name === pick); // Find the player object in payouts
      
        // Check if the player was found
        const payout = player ? player.payout : '0.00'; // If player exists, use their payout, otherwise use '0.00'
      
        console.log(`  Pick ${idx + 1}: ${pick} (Payout: $${payout})`);
      });
      
    });
  };
  
  // Call the function to log golfers' leaderboard and user picks
  logGolfersLeaderboardAndUsersPicks();
  
  const countPlayerPicks = () => {
    // console.log("counting player picks")
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

  const isProjectedCutLineVisible = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return today === 4 || today === 5; // 4 = Thursday, 5 = Friday
  };

  const playerCards = useMemo(() => {
    if(sortedUsers === undefined || unsortedUsers === undefined || (unsortedUsers?.length < 1 && sortedUsers?.length < 1)) return
    return [...sortedUsers, ...unsortedUsers].map((userObject, index) => {
      const user = userObject.user || userObject;
      const totalScore = calculateTotalScore(user);
      const totalWinnings = abbreviateNumber(user?.winnings || calculateTotalWinnings(user));
      const isLoggedInUser = username === user.username;
      const allPicksChosen = [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(pick => pick);
      return (
        <PlayerCard 
          key={`${user.username}-${refreshScoreboard}`} // helps force rerender on refresh
          user={user} 
          index={index} 
          totalScore={totalScore} 
          totalWinnings={totalWinnings} 
          isLoggedInUser={isLoggedInUser} 
          secretScoreboard={secretScoreboard}
          getPlayerScore={getPlayerScore}
          getPlayerPosition={getPlayerPosition}
          getPlayerRoundScore={getPlayerRoundScore}
          getPlayerThruStatus={getPlayerThruStatus}
          calculatePayouts={calculatePayoutsWrapper}
          picksChosen={allPicksChosen}
          username={username}
        />
      );
    });
  }, [sortedUsers, unsortedUsers, players, selectedPool,  secretScoreboard, payoutPercentages]);
  
  
  


  // Get top 3 picked players
  const top3Players = countPlayerPicks();

  //console.log("top 3 is ", top3Players)

  if (!isLoggedIn) {
    return <LoginScreen />;
  }
  
  return (
      <ScrollView 
        style={{backgroundColor: '#305115'}}
        horizontal={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        contentInsetAdjustmentBehavior="never"
      >
      <View style={{flex: 1, marginTop: 50, alignItems: 'center'}}>

      <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center',  width: screenWidth, justifyContent: "center" }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', left: scale(15) }}>
          <TouchableOpacity onPress={() => navigation.popToTop()} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: scale(11), marginRight: 5, color: 'white' }}>{'\u25C0'}</Text> 
            <Text style={{ fontSize: scale(11), color: 'white' }}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>


        {(tournament && active) && (
          <View style={styles.tournamentHeader}>
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            <Text style={styles.tournamentDetails}>
              Purse: ${tournament.purse.toLocaleString()} | Year: {tournament.year}
            </Text>
            {showProjectedCut && <Text style={styles.tournamentDetails}>Projected Cut: {cutLine}</Text>}
          </View>
        )}
        <View style={{marginBottom: scale(15)}}>
          <Slider onSelectTournamentScoreboard={() => setActive(true)} onSelectSeasonalScoreboard={() => setActive(false)} active={active} />
        </View>
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
          <SeasonLeaderboard selectedPool={selectedPool}/> 
          : 
          playerCards
        }
      </View>
    </ScrollView>
  );  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,  // <- IMPORTANT
    backgroundColor: '#305115',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    width: '100%', // <- FULL WIDTH
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#305115',
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
    color: '#305115',
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
    color: '#305115',
  },
  tournamentDetails: {
    fontSize: 16,
    color: '#305115',
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
    color: '#305115',
    width: '25%',
    textAlign: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#305115',
    width: '40%',
    textAlign: 'center',
    bottom: 20
  },
  totalScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#305115',
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
    color: '#305115',
  },
  pickValue: {
    width: '55%',
    fontSize: 16,
    color: '#305115',
  },
  pickScore: {
    width: '30%',
    fontSize: 16,
    color: '#305115',
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