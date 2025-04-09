import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../config';
import { useUser } from '../context/UserContext'; // Using the UserContext

const database = getDatabase(app);

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isLoggedIn, login } = useUser(); // Access login function from context

  useEffect(() => {
    if(navigation === null || navigation === undefined) return
    if (isLoggedIn) {
      if(Platform.OS !== 'ios') return navigation.navigate('Home'); 
      navigation.navigate('Scoreboard');
    }
  }, [isLoggedIn, navigation]);

  const handleSubmit = async () => {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        let isValidUser = false;
        
        for (const userId in users) {
          if (users[userId].username === username && users[userId].password === password) {
            isValidUser = true;
            await AsyncStorage.setItem('username', username);
            //console.log("we loggin in")
            login(username); // Use context login function
            break;
          }
        }

        if (!isValidUser) {
          setError('Invalid username or password');
        }
      } else {
        setError('No users found');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('An error occurred, please try again later');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{color: 'white', fontSize: 40, fontWeight: 'bold', bottom: 50}}>PutterPicks</Text>
      <View style={styles.loginBox}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="golf-ball" size={50} color='#18453B' />
        </View>
        <Text style={{fontSize: 36,marginBottom: 20}}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18453B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: '100%',
  },
  loginBox: {
    width: 300,
    minWidth: 300,
    padding: 20,
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoginScreen;
