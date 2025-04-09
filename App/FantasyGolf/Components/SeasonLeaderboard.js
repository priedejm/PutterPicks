import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { getDatabase, ref, get } from "firebase/database"; 
import { app } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const database = getDatabase(app);
const isIos = Platform.OS === 'ios';

const SeasonLeaderboard = () => {
  const [users, setUsers] = useState([]); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const username = await AsyncStorage.getItem('username');
      if (username) {
        setIsLoggedIn(true);
      }
    };
    checkUserLoggedIn();

    // Fetch users' season winnings data from Firebase
    const usersRef = ref(database, 'users');
    get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        const usersData = Object.values(snapshot.val()); // Get all users data
        // Sort users by season winnings in descending order
        usersData.sort((a, b) => b.seasonWinnings - a.seasonWinnings);
        setUsers(usersData); // Set the sorted users data
      } else {
        //console.log("No data available in 'users'");
      }
    }).catch((error) => {
      console.error("Error fetching users:", error);
    });
  }, []); // Empty dependency array to run only once when the component mounts

  const renderUsers = () => {
    return users.map((user, index) => (
      <View style={styles.row} key={index}>
        {/* Correctly wrapping the position in a Text component */}
        <Text style={[styles.cell, styles.posCell]}>{index + 1}</Text>

        {/* Correctly wrapping username in a Text component */}
        <Text style={[styles.cell, styles.playerCell]}>{user.username}</Text>

        {/* Correctly wrapping seasonWinnings in a Text component */}
        <Text style={[styles.cell, styles.winningsCell]}>
          {`$${user.seasonWinnings.toLocaleString()}`}
        </Text>
      </View>
    ));
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ width: 370, maxWidth: 500, alignSelf: 'center' }}>
          <View style={styles.header}>
            {/* Header with Text components */}
            <Text style={[styles.headerText, styles.posHeader]}>Pos</Text>
            <Text style={[styles.headerText, styles.playerHeader]}>Player</Text>
            <Text style={[styles.headerText, styles.winningsHeader]}>Season Winnings</Text>
          </View>

          {/* Rendering users */}
          {renderUsers()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#18453B',
  },
  container: {
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    height: isIos ? undefined : 1, // Ensures proper scrolling behavior on the web
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
  winningsHeader: {
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
  winningsCell: {
    flex: 2,
  },
});

export default SeasonLeaderboard;
