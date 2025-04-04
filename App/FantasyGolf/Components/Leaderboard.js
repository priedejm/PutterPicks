import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, RefreshControl } from 'react-native';
import { getDatabase, ref, get } from "firebase/database"; 
import { app } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from './Login';
import CountryFlag from 'react-native-country-flag';
import { countryCodeMap } from '../utils/countryCodeMap'; // Import the country code map
import { useUser } from '../context/UserContext'; // Import the UserContext

const database = getDatabase(app);
const isIos = Platform.OS === 'ios';

const Leaderboard = () => {
  const { triggerScoreboardRefresh } = useUser();
  const [players, setPlayers] = useState([]); 
  const [tournament, setTournament] = useState(null); // State for storing tournament info
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh

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
    fetchPlayers();
    fetchTournament();
  }, []);

  // Function to fetch players from the Firebase database
  const fetchPlayers = async (fromRefresh) => {
    console.log("fetching")
    const playersRef = ref(database, 'players/players');
    try {
      const snapshot = await get(playersRef);
      if (snapshot.exists()) {
        console.log("new playeres fetched")
        setPlayers(Object.values(snapshot.val())); 
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

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={isIos ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : null}
      >
        {/* Display Tournament Info at the top */}
        {tournament && (
          <View style={styles.tournamentHeader}>
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            <Text style={styles.tournamentDetails}>
              Purse: ${tournament.purse.toLocaleString()} | Year: {tournament.year}
            </Text>
          </View>
        )}

        <View style={{ width: 370, maxWidth: 500, alignSelf: 'center' }}>
          <View style={styles.header}>
            <Text style={[styles.headerText, styles.posHeader]}>Pos</Text>
            <Text style={[styles.headerText, styles.playerHeader]}>Player</Text>
            <Text style={[styles.headerText, styles.scoreHeader]}>Score</Text>
            <Text style={[styles.headerText, styles.thruHeader]}>Thru</Text>
            <Text style={[styles.headerText, styles.roundsHeader]}>Rounds</Text>
          </View>

          {renderPlayers()} {/* Calling the renderPlayers function */}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#45751e',
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
    fontSize: 16,
    color: '#45751e',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#45751e',
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
    color: '#45751e',
    textAlign: 'center',
  },
  posCell: {
    flex: 0.8,
  },
  playerCell: {
    fontSize: 14,
    color: '#45751e',
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
    color: '#45751e',
    textAlign: 'center',
  },
});

export default Leaderboard;
