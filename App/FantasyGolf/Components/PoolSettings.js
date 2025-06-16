import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import { getDatabase, ref, update, get } from 'firebase/database';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const PoolSettings = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { pool } = route.params;

  const initialAmountOfTiers = pool?.settings?.amountOfTiers ?? '';
  const initialPlayerPickLimit = pool?.settings?.playerPickLimit ?? '';
  const initialGolfersPicked = pool?.settings?.golfersPicked ?? '';
  let rosterFormat = pool?.settings?.rosterFormat ?? 'N/A';
  rosterFormat = rosterFormat ? 'Tiered' : 'Salary Cap';

  const [amountOfTiers, setAmountOfTiers] = useState(initialAmountOfTiers);
  const [playerPickLimit, setPlayerPickLimit] = useState(initialPlayerPickLimit);
  const [golfersPicked, setGolfersPicked] = useState(initialGolfersPicked);
  const [isChanged, setIsChanged] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    const normalizedTiers = amountOfTiers?.toString();
    const normalizedInitialTiers = initialAmountOfTiers?.toString();
    const normalizedPickLimit = playerPickLimit?.toString();
    const normalizedInitialPickLimit = initialPlayerPickLimit?.toString();
    const normalizedGolfersPicked = golfersPicked?.toString();
    const normalizedInitialGolfersPicked = initialGolfersPicked?.toString();

    setIsChanged(
      normalizedTiers !== normalizedInitialTiers ||
      normalizedPickLimit !== normalizedInitialPickLimit ||
      normalizedGolfersPicked !== normalizedInitialGolfersPicked
    );
  }, [amountOfTiers, playerPickLimit, golfersPicked]);

  const handleSave = async () => {
    try {
      if (!pool?.id) {
        Alert.alert('Error', 'No pool key found.');
        return;
      }

      const updates = {};
      if (amountOfTiers?.toString() !== initialAmountOfTiers?.toString()) {
        updates.amountOfTiers = amountOfTiers;
      }
      if (playerPickLimit?.toString() !== initialPlayerPickLimit?.toString()) {
        updates.playerPickLimit = playerPickLimit;
      }
      if (golfersPicked?.toString() !== initialGolfersPicked?.toString()) {
        updates.golfersPicked = golfersPicked;
      }

      if (Object.keys(updates).length === 0) {
        Alert.alert('No Changes', 'Nothing to update.');
        return;
      }

      const db = getDatabase();
      await update(ref(db, `pools/${pool.id}/settings`), updates);

      Alert.alert('Success', 'Settings updated.');
      setIsChanged(false);
    } catch (error) {
      console.error('Save Error:', error);
      Alert.alert('Error', 'Failed to update settings.');
    }
  };

  const sendNotification = async () => {
    if (!title || !body) {
      Alert.alert('Error', 'Please enter both title and body.');
      return;
    }
  
    setSending(true);
  
    try {
      const db = getDatabase();
      const snapshot = await get(ref(db, 'users'));
  
      if (!snapshot.exists()) {
        Alert.alert('Error', 'No users found.');
        setSending(false);
        return;
      }
  
      const users = snapshot.val();
      const poolUsernames = Object.values(pool.users || {}).map(u => u.username);
      const tokens = [];
  
      Object.values(users).forEach(user => {
        if (user.username && poolUsernames.includes(user.username) && user.expoToken) {
          tokens.push(user.expoToken);
        }
      });
  
      if (tokens.length === 0) {
        Alert.alert('Info', 'No users with Expo tokens found.');
        setSending(false);
        return;
      }
  
      const results = await Promise.all(
        tokens.map(token =>
          axios.post('https://exp.host/--/api/v2/push/send', {
            to: token,
            title,
            body,
            sound: 'default',
          }).then(res => ({ token, res: res.data }))
            .catch(error => ({ token, error }))
        )
      );
  
      const failed = results.filter(r =>
        r.res?.data?.status === 'error' ||
        r.error
      );
  
      if (failed.length > 0) {
        const messages = failed.map(f => {
          if (f.error) {
            return `Token: ${f.token}\nError: ${f.error.message}`;
          } else {
            const details = f.res?.data?.details?.error || 'Unknown error';
            return `Token: ${f.token}\nError: ${f.res.data.message} (${details})`;
          }
        }).join('\n\n');
  
        Alert.alert(
          'Some notifications failed',
          messages.length > 400 ? messages.slice(0, 400) + '...' : messages
        );
      } else {
        Alert.alert('Success', `Notification sent to ${tokens.length} users.`);
        setTitle('');
        setBody('');
      }
    } catch (error) {
      console.error('Notification Error:', error);
      Alert.alert('Error', 'Failed to send notifications.');
    } finally {
      setSending(false);
    }
  };
  

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#305115' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Pool Settings</Text>

        {pool?.settings?.rosterFormat && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Roster Format</Text>
            <Text style={styles.settingValue}>{rosterFormat}</Text>
          </View>
        )}

        {pool?.settings?.amountOfTiers !== undefined && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Amount of Tiers</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={String(amountOfTiers)}
                onValueChange={(value) => setAmountOfTiers(String(value))}
                style={styles.picker}
                itemStyle={{ color: 'white' }}
              >
                {[4, 5, 6, 7, 8].map(n => (
                  <Picker.Item key={n} label={String(n)} value={String(n)} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {pool?.settings?.playerPickLimit !== undefined && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Player Pick Limit</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={String(playerPickLimit)}
                onValueChange={(value) => setPlayerPickLimit(value)}
                style={styles.picker}
                itemStyle={{ color: 'white' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 'unlimited'].map(n => (
                  <Picker.Item key={n} label={String(n)} value={String(n)} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Golfers Picked Section (Picker dropdown like Player Pick Limit) */}
        {pool?.settings?.golfersPicked !== undefined && (
          <View style={styles.settingItem}>
            <Text style={styles.settingKey}>Golfers Picked</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={String(golfersPicked)}
                onValueChange={(value) => setGolfersPicked(value)}
                style={styles.picker}
                itemStyle={{ color: 'white' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <Picker.Item key={n} label={String(n)} value={String(n)} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, !isChanged && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!isChanged}
        >
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>

        {pool?.settings && <View style={styles.divider} />}

        <Text style={styles.subtitle}>Send Notification to Pool Users</Text>
        
        <View style={styles.notificationSection}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="Body"
            placeholderTextColor="#999"
            value={body}
            multiline
            onChangeText={setBody}
            returnKeyType="done"
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.button, !(title && body) && { opacity: 0.5 }]}
            onPress={sendNotification}
            disabled={sending || !title || !body}
          >
            <Text style={styles.buttonText}>{sending ? 'Sending...' : 'Send Notification'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#305115',
    padding: scale(20),
    paddingTop: scale(35),
    paddingBottom: scale(40),
  },
  backButton: {
    marginTop: scale(20),
    marginBottom: scale(10),
  },
  backButtonText: {
    color: 'white',
    fontSize: scale(16),
  },
  title: {
    fontSize: scale(24),
    fontWeight: 'bold',
    marginBottom: scale(20),
    color: 'white',
  },
  settingItem: {
    marginBottom: scale(15),
  },
  settingKey: {
    fontSize: scale(16),
    fontWeight: '600',
    color: 'white',
  },
  settingValue: {
    fontSize: scale(14),
    color: 'white',
    marginTop: scale(4),
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: scale(8),
    marginTop: scale(4),
  },
  picker: {
    height: scale(50),
    justifyContent: 'center',
    overflow: 'hidden',
    color: 'white',
  },
  divider: {
    marginVertical: scale(30),
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  subtitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    marginBottom: scale(15),
    color: 'white',
  },
  notificationSection: {
    marginBottom: scale(20),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: scale(8),
    padding: scale(12),
    fontSize: scale(14),
    marginBottom: scale(15),
    backgroundColor: 'white',
    color: 'black',
  },
  bodyInput: {
    height: scale(100),
    paddingTop: scale(12),
  },
  button: {
    backgroundColor: '#ffdf00',
    padding: scale(12),
    borderRadius: scale(8),
    alignItems: 'center',
    marginBottom: scale(15),
  },
  buttonText: {
    color: 'black',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
});

export default PoolSettings;