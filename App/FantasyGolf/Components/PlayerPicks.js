import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { getDatabase, ref, get, onValue, update } from 'firebase/database';
import { app } from '../config';
import { useUser } from '../context/UserContext';
import LoginScreen from './Login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SeasonLongPlayerPicks from './GameModes/SeasonLongPlayerPicks';
import MajorsOnlyPlayerPicks from './GameModes/MajorsOnlyPlayerPicks';

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);

const PlayerPicks = () => {
  const { triggerScoreboardRefresh, selectedPool, setSelectedPool } = useUser();
  const [lockedPicks, setLockedPicks] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const lockedPicksRef = ref(database, 'featureflags/lockedPicks');
    // Set up a real-time listener for changes in 'lockedPicks'
    const listener = onValue(lockedPicksRef, (snapshot) => {
      if (snapshot.exists()) {
        setLockedPicks(snapshot.val());
      }
    });
    // Cleanup listener on component unmount
    return () => {
      listener(); // Unsubscribe from the listener
    };
  }, []);

  useEffect(() => {
    const playersRef = ref(database, 'players/players');
    get(playersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setPlayers(Object.values(snapshot.val()));
      } else {
        //console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {selectedPool.mode === "Season Long League" ? <SeasonLongPlayerPicks players={players} lockedPicks={lockedPicks}/> : 
       selectedPool.mode === "Majors Only" ? <MajorsOnlyPlayerPicks players={players} lockedPicks={lockedPicks}/> : null}
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#305115',
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    top: 10,
  },
  logoutText: {
    paddingRight: 20,
    color: 'white',
  },
  pastPicksButton: {
    position: 'absolute',
    left: 10,
    top: 10,
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
  },
  closeModalText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    maxWidth: 500,
    minWidth: 300,
    alignSelf: 'center',
    top: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
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
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#ffdf00',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
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
});

export default PlayerPicks;