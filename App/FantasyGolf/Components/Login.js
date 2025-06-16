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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, login } = useUser();

  useEffect(() => {
    if (!navigation) return;
    if (isLoggedIn) {
      if (Platform.OS !== 'ios') return navigation.navigate('Home');
      navigation.navigate('Scoreboard');
    }
  }, [isLoggedIn, navigation]);

  // Clear messages when switching between login/register
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Handle Login
  const handleSubmit = async () => {
    if (isLoading) return;
    
    clearMessages();
    setIsLoading(true);

    try {
      const usernameRef = ref(database, `usernames/${username}`);
      const emailSnap = await get(usernameRef);
      
      if (!emailSnap.exists()) {
        setError('Username not found');
        return;
      }
      
      const email = emailSnap.val();
      const resp = await signInWithEmailAndPassword(auth, email, password);

      await AsyncStorage.setItem('username', username);
      const userToSet = {username: username, email: email};
      await AsyncStorage.setItem('user', JSON.stringify(userToSet));
      
      login(username);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async () => {
    if (isLoading) return;
    
    clearMessages();

    // Validation
    if (!email || !password || !username || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Check if username already exists
      const usernameRef = ref(database, `usernames/${username}`);
      const usernameSnap = await get(usernameRef);
      
      if (usernameSnap.exists()) {
        setError('Username already taken');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save the username to email mapping in Firebase Realtime Database
      await set(ref(database, `usernames/${username}`), email);
      // Save user details to users/{uid}
      await set(ref(database, `users/${uid}`), {
        username,
        email,
      });

      await AsyncStorage.setItem('username', username);
      const userToSet = {username: username, email: email};
      await AsyncStorage.setItem('user', JSON.stringify(userToSet));
      
      // Success! Log them in automatically
      login(username);
      setIsLoggedIn(true);
      setSuccess('Account created successfully! Welcome to PutterPicks!');
      
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email is already registered');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(error.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
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
            editable={!isLoading}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <TouchableOpacity
          onPress={isRegistering ? handleRegister : handleSubmit}
          style={[styles.button, isLoading && styles.buttonDisabled]}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading 
              ? (isRegistering ? 'Creating Account...' : 'Logging in...') 
              : (isRegistering ? 'Create Account' : 'Login')
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            setIsRegistering(!isRegistering);
            clearMessages();
            setConfirmPassword('');
          }}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, isLoading && styles.textDisabled]}>
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
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  toggleText: {
    marginTop: 15,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  textDisabled: {
    color: '#cccccc',
  },
});

export default LoginScreen;