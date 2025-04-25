// JoinPool.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ScaledSheet, scale } from 'react-native-size-matters';

export default function JoinPool() {
  const [poolCode, setPoolCode] = useState('');

  const handleJoin = () => {
    // Logic to join the pool goes here
    console.log('Joining pool with code:', poolCode);
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
    padding: '20@s',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: '18@s',
    marginBottom: '10@s',
    color: '#333',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    padding: '12@s',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: '8@s',
    marginBottom: '20@s',
    fontSize: '16@s',
    color: '#000',
  },
  button: {
    backgroundColor: '#305115',
    paddingVertical: '12@s',
    paddingHorizontal: '20@s',
    borderRadius: '8@s',
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: '16@s',
    fontWeight: '600',
  },
});
