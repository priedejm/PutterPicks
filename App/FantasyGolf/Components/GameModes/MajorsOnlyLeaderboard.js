import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, RefreshControl, Image, Dimensions, TouchableOpacity } from 'react-native';
import { getDatabase, ref, get, update, onValue } from "firebase/database"; 
import { app } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  scale,
  ScaledSheet,
} from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';

import CountryFlag from 'react-native-country-flag';
import { countryCodeMap } from '../../utils/countryCodeMap'; // Import the country code map
import { useUser } from '../../context/UserContext'; // Import the UserContext
import PlayerCard from '../PlayerCard';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useCallback } from 'react';
import { calculatePayouts } from '../../utils/utilFunctions';



const database = getDatabase(app);
const screenWidth = Dimensions.get('window').width;
const isIos = Platform.OS === 'ios';
const isLargeScreen = !isIos

const MajorsOnlyLeaderboard = () => {
  const { triggerScoreboardRefresh, isLoggedIn, refreshScoreboard, selectedPool } = useUser();
  const navigation = useNavigation();

  const [payoutPercentages, setPayoutPercentages] = useState([]);
  const route = useRoute();
  const latestTournament = selectedPool.tournaments[selectedPool.tournaments.length - 1];
  const [players, setPlayers] = useState([]); 
  const [tournament, setTournament] = useState(latestTournament); // State for storing tournament info
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
  const [username, setUsername] = useState(); // State for pull-to-refresh
  const [user, setUser] = useState(); // State for pull-to-refresh
  const [users, setUsers] = useState();
  const [amateurPlayers, setAmateurPlayers] = useState([]);
  const [specialPayout, setSpecialPayout] = useState();
  const [cutLine, setCutLine] = useState();
  const [showProjectedCut, setShowProjectedCut] = useState(false);
  // console.log("selectedPool is", selectedPool, route)
  // console.log("useres are", selectedPool?.users)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername && selectedPool?.users) {
          setUsername(storedUsername);
          const matchedUser = selectedPool.users.find(user => user.username === storedUsername);
          console.log("we got a matchoned one tho right", matchedUser)
          if (matchedUser) {
            setUser(matchedUser);
          } else {
            console.warn("No user matched for username:", storedUsername);
          }
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
  }, [selectedPool]);


  useFocusEffect(
    useCallback(() => {
      const playersRef = ref(database, 'players/players');
      const unsubscribePlayers = onValue(playersRef, snapshot => {
        if (snapshot.exists()) {
          let players = Object.values(snapshot.val());
          setPlayers(players);
        }
      });
  
      return () => {
        unsubscribePlayers();
      };
      
    }, [refreshScoreboard, username])
  );

  useEffect(() => {
    setShowProjectedCut(isProjectedCutLineVisible());
  }, []);  

  useEffect(() => {
    if(players?.length < 1 || payoutPercentages?.length < 1) return;
    //console.log("array length", payoutPercentages?.length)
    //console.log("this is the 50th player", players[payoutPercentages?.length-1])
    setCutLine(players[payoutPercentages?.length-1]?.score)
  }, [players, payoutPercentages])
  
  // useEffect(() => {
  //   fetchTournament();
  // }, [refreshScoreboard]);

  useFocusEffect(
    useCallback(() => {
      const specialPayoutRef = ref(database, 'featureflags/specialPayout');
      const unsubscribe = onValue(specialPayoutRef, (snapshot) => {
        if (snapshot.exists()) {
          setSpecialPayout(snapshot.val());
        }
      });
  
      return () => unsubscribe();
    }, [])
  );  

  // Update seasonWinnings for each user
  // useEffect(() => {
  //   if(!users) return;
  //   updateUsersSeasonWinnings(users, selectedPool.name);
  // }, [users]);
  
  // Reset picks and update pickHistory and their counts
  // useEffect(() => {
  //   if(!users || !selectedPool) return;
  //   resetUserPicks(users, "Fantasy Golf");
  // }, [users]);

  // adds current entries to the latest tournament - have payouts if we want to add that
  // useEffect(() => {
  //   syncPicksToTournament(players, calculatePayouts, selectedPool.name, users);
  // }, [players]);

  // const fetchPlayers = async (fromRefresh) => {
  //   //console.log("fetching");
  //   const playersRef = ref(database, 'players/players');
  //   try {
  //     const snapshot = await get(playersRef);
  
  //     if (snapshot.exists()) {
  //       //console.log("new players fetched");
  //       setPlayers(Object.values(snapshot.val())); 
  //       // Find the user with the matching username
  //       const foundUser = Object.values(users).find(user => user.username === username);
  //       console.log("username is", username)
  //       if (foundUser) {
  //         // Set the found user to the context or state
  //         setUser(foundUser);  // Assuming you have a setUser function in context or state
  //       }
  //       if(fromRefresh) triggerScoreboardRefresh();
  //     } else {
  //       //console.log("No data available");
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };
  

  // Function to fetch tournament info from the Firebase database
  // const fetchTournament = async () => {
  //   const tournamentRef = ref(database, 'tournaments');
  //   try {
  //     const snapshot = await get(tournamentRef);
  //     if (snapshot.exists()) {
  //       const tournamentsArray = Object.values(snapshot.val());
  //       const latestTournament = tournamentsArray[tournamentsArray.length - 1];
  //       setTournament(latestTournament);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching tournament data:", error);
  //   }
  // };

  // Function to handle pull-to-refresh
  const onRefresh = () => {
    return
    // setRefreshing(true);
    // fetchPlayers(true);
    // fetchTournament();
    // setRefreshing(false);
  };

  const getIsoCode = (countryCode) => {
    if (!countryCode) return;
    return countryCodeMap[countryCode] || countryCode.toLowerCase();
  };

  const getPlayerPosition = (playerName) => {
    const player = players.find(player => player.name === playerName);
    return player ? player.position : "N/A";
  };

  const getPlayerThruStatus = (playerName) => {
    const player = players.find(player => player.name === playerName);
    return player ? player.thru_status : "N/A";
  };

  const getPlayerRoundScore = (playerName) => {
    const player = players.find(player => player.name === playerName);
    const roundScore = player?.round;
    return roundScore != null && roundScore !== '' ? roundScore : 'E';
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

    // Function to format player name
    const formatPlayerName = (name) => {
      if (!name) return '';
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' '); // In case of multiple last names
      return `${firstName.charAt(0)}. ${lastName}`;
    }

    const calculateTotalScore = useCallback((user) => {
      if(!user) return 0;
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

  const calculateTotalWinnings = (user) => {
    if (!user) return 0;
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
  
  const isProjectedCutLineVisible = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return today === 4 || today === 5; // 4 = Thursday, 5 = Friday
  };
  
  
  const getRankSuffix = (rank) => {
    if (rank === 1) return "st";
    if (rank === 2) return "nd";
    if (rank === 3) return "rd";
    return "th";
  };

  const calculatePayoutsWrapper = useCallback(() => {
    return calculatePayouts(tournament, players, amateurPlayers, payoutPercentages, specialPayout);
  }, [tournament, players, amateurPlayers, payoutPercentages, specialPayout]);
  

  const getUserRank = useMemo(() => {
    if (!users || !username) return null;
    console.log("whats this", users)
    const sortedUsers = [...users]
      .filter(user =>
        [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(pick => pick)
      )
      .sort((a, b) => calculateTotalWinnings(b) - calculateTotalWinnings(a));

    const rank = sortedUsers.findIndex(u => u.username === username) + 1;
    return rank ? `${rank}${getRankSuffix(rank)}` : null;
  }, [users, username]);

  const renderPlayers = useMemo(() => {
    if (!tournament || !tournament.purse) return;
    if (!Array.isArray(players) || players.length === 0) return;
    if (!Array.isArray(amateurPlayers)) return;
    if (!Array.isArray(payoutPercentages) || payoutPercentages.length === 0) return;
    if (!specialPayout) return;
    const payouts = calculatePayoutsWrapper();
    return players.map((item, index) => {
      let country = getIsoCode(item.country);
      const hasntTeedOff = item.thru_status.includes(':');
      const payoutEntry = payouts.find(p => p.name === item.name);
      const abbreviatedPayout = payoutEntry ? abbreviateNumber(parseFloat(payoutEntry?.payout?.replace(/,/g, ''))) : '-';

      return (
        <View style={styles.row} key={index}>
          <View style={styles.posCell}>
            <Text style={[styles.cell]}>{item.position || "N/A"}</Text>
          </View>
          <View style={styles.playerCell}>
            <CountryFlag isoCode={country} size={15} />
            <Text style={[styles.cell, {marginLeft: isLargeScreen ? 5 : scale(5), width: scale(85), textAlign: 'left'}]} numberOfLines={1}>{formatPlayerName(item.name) || "Unknown"}</Text>
          </View>
          <View style={[styles.scoreCell, {marginLeft: isIos ? scale(5) : -8 }]}>
            <Text style={[styles.cell]}>{item.score || "E"}</Text>
          </View>
          <View style={[styles.thruCell, {width: isIos ? scale(60) : 70 ,  marginLeft: isIos ? scale(10) : 10 }]}>
            <Text style={styles.cell}>{item.thru_status || "N/A"}</Text>
          </View>
          <View style={[styles.roundCell, {marginLeft: isIos ? scale(10) : 0 }]}>
            <Text style={styles.cell}>{item.round || "E"}</Text>
          </View>
          <Text style={[styles.earningsCell, {marginLeft: isIos ? scale(10) : 0 }]}>
            {abbreviatedPayout}
          </Text>
        </View>
      );
    });
  }, [tournament, players, amateurPlayers, payoutPercentages, specialPayout,]);
  
  const totalWinnings = calculateTotalWinnings(user);
  const allPicksChosen = useMemo(() => (
    [user?.pick1, user?.pick2, user?.pick3, user?.pick4, user?.pick5, user?.pick6].every(pick => pick)
  ), [user]);

  const memoizedPlayerCard = useMemo(() => {
    console.log("whats this like", user, totalWinnings)
    console.log("is this true", !totalWinnings)
    if (!user) return null;
    const sortedUsers = [...users]
      .filter(user =>
        [user.pick1, user.pick2, user.pick3, user.pick4, user.pick5, user.pick6].every(pick => pick)
      )
      .sort((a, b) => calculateTotalWinnings(b) - calculateTotalWinnings(a));

    const rank = sortedUsers.findIndex(u => u.username === username) + 1;
    const userRank = rank ? `${rank}${getRankSuffix(rank)}` : null;
    const totalScore = calculateTotalScore(user);
    return (
      <PlayerCard
        personalCard={true}
        user={user}
        totalScore={totalScore}
        totalWinnings={totalWinnings}
        isLoggedInUser={true}
        secretScoreboard={false}
        getPlayerPosition={getPlayerPosition}
        getPlayerScore={getPlayerScore}
        calculatePayouts={calculatePayoutsWrapper}
        getPlayerThruStatus={getPlayerThruStatus}
        getPlayerRoundScore={getPlayerRoundScore}
        abbreviateNumber={abbreviateNumber}
        picksChosen={allPicksChosen}
        userRank={userRank}
        username={username}
      />
    );
  }, [user,totalWinnings,allPicksChosen,username]);
  
  //console.log("user", user)
  //console.log("heller", totalWinnings)
  return (
    <View style={styles.wrapper}>
      <View style={{ flex: 1, backgroundColor: '#305115', marginTop: scale(50), overflow: 'visible' }}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={isIos ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          ) : null}
        >
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', left: scale(15),}}>
          <TouchableOpacity onPress={() => navigation.popToTop()} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: scale(11), marginRight: 5, color: 'white' }}>{'\u25C0'}</Text> 
            <Text style={{ fontSize: scale(11), color: 'white' }}>Home</Text>
          </TouchableOpacity>
        </View>
          <View style={{flex: 1, top: scale(50), alignItems: 'center'}}>
            {tournament && (
              <View style={styles.tournamentHeader}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <Text style={styles.tournamentDetails}>
                  Purse: ${tournament.purse.toLocaleString()} | Year: {tournament.year}
                </Text>
                {showProjectedCut && <Text style={styles.tournamentDetails}>Projected Cut: {cutLine}</Text>}
              </View>
            )}
            {user && 
              <View style={{bottom: 40}}>
               {memoizedPlayerCard}
              </View>
            }
            <View style={{ width: 380, maxWidth: 500, alignSelf: 'center' , bottom: 40 }}>
              <View style={styles.header}>
                <Text style={[styles.headerText, {width: isLargeScreen ? '30%' : scale(40)}]}>Pos</Text>
                <Text style={[styles.headerText, { textAlign: 'left', width: isLargeScreen ? '55%' : scale(85), marginLeft: isLargeScreen ? 20 : undefined }]}>Player</Text>
                <Text style={[styles.headerText, {marginLeft: isLargeScreen ? 35 : scale(25), textAlign: 'left', width: isLargeScreen ? '30%' : scale(40)}]}>Score</Text>
                <Text style={[styles.headerText, {marginLeft: isLargeScreen ? 10 : scale(10), textAlign: 'left', width: isLargeScreen ? '30%' : scale(35)}]}>Thru</Text>
                <Text style={[styles.headerText, {marginLeft: isLargeScreen ? 10 : scale(15), textAlign: 'left', width: isLargeScreen ? '30%' : scale(50)}]}>Round</Text>
              </View>
              {renderPlayers}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const scaledStyles = ScaledSheet.create({  
  wrapper: {
    flex: 1,
    backgroundColor: '#305115',
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
    marginBottom: 50,
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
    color: '#305115',
  },
  tournamentDetails: {
    fontSize: 16,
    color: '#305115',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#305115',
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
    flex: 2,
    textAlign: 'left',
  },
  scoreHeader: {
    flex: 1.2,
  },
  thruHeader: {
    flex: 1,
  },
  roundHeader: {
    flex: .8,
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
    color: '#305115',
    textAlign: 'center',
  },
  posCell: {
    width: '30@s',
    //backgroundColor: 'red',
  },
  playerCell: {
    fontSize: 14,
    color: '#305115',
    textAlign: 'left',
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    width: '105@s',
    //backgroundColor: 'grey',
  },
  scoreCell: {
    width: '25@s',
    marginLeft: '5@s',
    //backgroundColor: 'yellow',
  },
  roundCell: {
    width: '25@s',
    marginLeft: '15@s',
    //backgroundColor: 'yellow',
  },
  thruCell: {
    width: '60@s',
    marginLeft: '20@s',
    // backgroundColor: 'pink',
  },
  earningsCell: {
    width: '40@s',
    fontSize: 14,
    color: '#305115',
    textAlign: 'center',
    marginLeft: '20@s',
    //backgroundColor: 'purple',
  },
});

const regularStyles = StyleSheet.create({  
  wrapper: {
    flex: 1,
    backgroundColor: '#305115',
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
    color: '#305115',
  },
  tournamentDetails: {
    fontSize: 16,
    color: '#305115',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#305115',
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
    flex: 2,
    textAlign: 'left',
  },
  scoreHeader: {
    flex: 1.2,
  },
  thruHeader: {
    flex: 1,
  },
  roundHeader: {
    flex: .8,
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
    color: '#305115',
    textAlign: 'center',
  },
  posCell: {
    width: 35,
    //backgroundColor: 'red',
  },
  playerCell: {
    fontSize: 14,
    color: '#305115',
    textAlign: 'left',
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    width: 130,
    //backgroundColor: 'grey',
  },
  scoreCell: {
    width: 30,
    marginLeft: 10,
    //backgroundColor: 'yellow',
  },
  roundCell: {
    width: 30,
    marginLeft: 15,
    //backgroundColor: 'yellow',
  },
  thruCell: {
    width: 30,
    marginLeft: 15,
    //backgroundColor: 'pink',
  },
  earningsCell: {
    width: 50,
    fontSize: 14,
    color: '#305115',
    textAlign: 'center',
    marginLeft: 15,
    //backgroundColor: 'purple',
  },
});

const styles = !isIos ? regularStyles : scaledStyles;


export default MajorsOnlyLeaderboard;
