import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, get, set } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config';
import { useUser } from '../context/UserContext';

const database = getDatabase(app);
const auth = getAuth(app);

const LoginScreen = ({ navigation, setIsLoggedIn }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // New for Firebase Auth
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isLoggedIn, login } = useUser();

  useEffect(() => {
    if (!navigation) return;
    if (isLoggedIn) {
      if (Platform.OS !== 'ios') return navigation.navigate('Home');
      navigation.navigate('Scoreboard');
    }
  }, [isLoggedIn, navigation]);

  // Handle Login
  const handleSubmit = async () => {
    console.log("hello")
    try {
      const usernameRef = ref(database, `usernames/${username}`);
      const emailSnap = await get(usernameRef);
      console.log("hello 2")
      if (!emailSnap.exists()) {
        setError('Username not found');
        return;
      }
      console.log("hello 3")
      const email = emailSnap.val();
      await signInWithEmailAndPassword(auth, email, password);
      console.log("hello 4")
      await AsyncStorage.setItem('username', username);
      setIsLoggedIn(true);
      console.log("hello", username)
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password');
    }
  };

  // Handle Registration
  const handleRegister = async () => {
    if (!email || !password || !username) {
      setError('All fields are required');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save the username to email mapping in Firebase Realtime Database
      await set(ref(database, `usernames/${username}`), email);
      // Save user details to users/{uid} if needed
      await set(ref(database, `users/${uid}`), {
        username,
        email,
        password,
      });

      await AsyncStorage.setItem('username', username);
      login(username);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PutterPicks</Text>
      <View style={styles.loginBox}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="golf-ball" size={50} color='#305115' />
        </View>
        <Text style={styles.heading}>{isRegistering ? 'Create Account' : 'Login'}</Text>

        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        )}

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

        <TouchableOpacity
          onPress={isRegistering ? handleRegister : handleSubmit}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {isRegistering ? 'Create Account' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setIsRegistering(!isRegistering);
          setError('');
        }}>
          <Text style={styles.toggleText}>
            {isRegistering ? 'Already have an account? Login' : 'No account? Create one'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#305115',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: '100%',
  },
  title: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
    bottom: 50,
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
  heading: {
    fontSize: 36,
    marginBottom: 20,
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
    width: '100%',
    marginTop: 10,
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
  toggleText: {
    marginTop: 15,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
