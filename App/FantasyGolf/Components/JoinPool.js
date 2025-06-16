// JoinPool.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ScaledSheet, scale } from 'react-native-size-matters';
import { getDatabase, ref, get, update } from 'firebase/database';
import { app } from '../config';

export default function JoinPool({user, pools}) {
  const [poolCode, setPoolCode] = useState('');

  const handleJoin = async () => {
    console.log("joining", poolCode, user);
    if (!poolCode || !user || !user.email) {
      Alert.alert('Missing Info', 'Please enter a valid code and make sure you are signed in.');
      return;
    }
  
    const db = getDatabase(app);
    const poolsRef = ref(db, 'pools');
    console.log("about to try stuff")
    try {
      const snapshot = await get(poolsRef);
      if (!snapshot.exists()) {
        Alert.alert('Error', 'No pools found.');
        return;
      }
  
      const poolsData = snapshot.val();
      let matchedKey = null;
      let matchedPool = null;
  
      // Find the pool with the matching share code
      Object.entries(poolsData).forEach(([key, pool]) => {
        if (pool.shareCode === poolCode) {
          matchedKey = key;
          matchedPool = pool;
        }
      });
  
      if (!matchedPool) {
        Alert.alert('Not Found', 'No pool found with that share code.');
        return;
      }
  
      const existingUser = matchedPool.users?.find(u => u.email === user.email);
      if (existingUser) {
        Alert.alert('Already Joined', 'You have already joined this pool.');
        return;
      }
  
      const newUser = {
        email: user.email,
        username: user.username || 'Anonymous',
        pick1: "",
        pick2: "",
        pick3: "",
        pick4: "",
        pick5: "",
        pick6: "",
        alt1: "",
        alt2: "",
        seasonWinnings: 0,
        pickHistory: [],
      };
  
      const updatedUsers = matchedPool.users ? [...matchedPool.users, newUser] : [newUser];
      const poolRef = ref(db, `pools/${matchedKey}`);
  
      await update(poolRef, { users: updatedUsers });
  
      Alert.alert('Success', 'You’ve joined the pool!');
      // Optionally navigate or refresh
    } catch (error) {
      console.error('Error joining pool:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pool Code</Text>
      <TextInput
        value={poolCode}
        onChangeText={setPoolCode}
        placeholder="Enter Pool Code"
        style={styles.input}
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity style={styles.button} onPress={handleJoin}>
        <Text style={styles.buttonText}>Join</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    padding: '15@s',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: '14@s',
    marginBottom: '8@s',
    color: '#333',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    padding: '10@s',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: '6@s',
    marginBottom: '15@s',
    fontSize: '14@s',
    color: '#000',
  },
  button: {
    backgroundColor: '#305115',
    paddingVertical: '10@s',
    paddingHorizontal: '16@s',
    borderRadius: '6@s',
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: '14@s',
    fontWeight: '600',
  },
});
