import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, get, ref } from 'firebase/database';
import { app } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import LoginScreen from './Login';
import FilterTabs from './FilterTabs';
import { LinearGradient } from 'expo-linear-gradient';

const golfImages = [
  require('../assets/StockImages/golf1.jpg'),
  require('../assets/StockImages/golf2.jpg'),
  require('../assets/StockImages/golf3.jpg'),
  require('../assets/StockImages/golf4.jpg'),
  require('../assets/StockImages/golf5.jpg'),
];

const isIos = Platform.OS === 'ios';
const database = getDatabase(app);
const auth = getAuth(app);

const Dashboard = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pools, setPools] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchPools = async () => {
      const poolsSnapshot = await get(ref(database, 'pools'));
      const tournamentData = Object.values(poolsSnapshot.val());

      const poolsWithImages = tournamentData.map(pool => ({
        ...pool,
        image: golfImages[Math.floor(Math.random() * golfImages.length)],
      }));

      setPools(poolsWithImages);
    };

    fetchPools();
  }, []);

  useEffect(() => {
    const checkStoredUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const isLoggedIn = await AsyncStorage.getItem('username');
      console.log("well, isLoggedIn?", isLoggedIn)
      if (isLoggedIn) {
        setIsLoggedIn(isLoggedIn);
      }
      setLoading(false);
    };

    checkStoredUser();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await AsyncStorage.setItem('user', JSON.stringify(currentUser));
      } else {
        await AsyncStorage.removeItem('user');
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('user');
      await signOut(auth);
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatCurrency = (value) => {
    if (isNaN(value)) return '$0';
    return `$${Number(value).toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen setIsLoggedIn={setIsLoggedIn}/>;
  }

  return (
    <View style={styles.flexContainer}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.dashboardText}>Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={{ paddingRight: scale(20) }}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={{ fontSize: scale(24), paddingLeft: scale(20), color: 'white', marginBottom: scale(10) }}>Active Pools</Text>
        {pools?.map((pool, index) => {
          console.log("uh sorry?", pool)
          const latestTournament = pool.tournaments[pool.tournaments.length - 1];
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Main', { selectedPool: pool })}

              key={index}
              style={{ backgroundColor: 'white', padding: 10, width: scale(310), height: scale(200), alignSelf: 'center', borderRadius: scale(5), overflow: 'hidden', marginBottom: scale(20),}}
            >
              <Image
                source={pool.image}
                style={{ width: scale(310), height: scale(200), position: 'absolute' }}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: scale(150) }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: scale(150) }}
              />
              <View style={{ position: 'absolute', bottom: scale(5), left: scale(5) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) }}>
                  <Text style={{ color: 'white', fontSize: scale(22), fontWeight: 'bold' }}>
                    {pool.name} |
                  </Text>
                  <Text style={{ color: 'white', fontSize: scale(14), fontWeight: 'bold', marginLeft: scale(5), top: scale(2) }}>
                    {pool.mode}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) }}>
                  <Text style={{ fontSize: scale(14), marginRight: scale(5) }}>🏆</Text>
                  <Text style={{ color: 'white', fontSize: scale(14) }}>{latestTournament.name}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) }}>
                  <Text style={{ fontSize: scale(14), marginRight: scale(5) }}>💰</Text>
                  <Text style={{ color: 'white', fontSize: scale(14) }}>{formatCurrency(latestTournament.purse)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.floatingButton}
      >
        <Text style={styles.plusIcon}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View
            style={{
              height: scale(475),
              width: scale(300),
              backgroundColor: 'white',
              borderRadius: 20,
              overflow:'hidden'
            }}
            onStartShouldSetResponder={() => true} // This prevents the modal itself from closing when touched
          >
            <FilterTabs />
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#305115',
  },
  container: {
    flex: 1,
    backgroundColor: '#305115',
  },
  header: {
    marginTop: scale(50),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: scale(20),
    marginBottom: scale(10),
  },
  dashboardText: {
    fontSize: scale(30),
    color: 'white',
    fontWeight: 'bold',
  },
  logoutText: {
    fontSize: scale(16),
    color: 'white',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#305115',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'white',
    width: '90%',
    alignSelf: 'center',
    marginBottom: scale(20),
  },
  floatingButton: {
    position: 'absolute',
    bottom: scale(25),
    right: scale(25),
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  plusIcon: {
    color: 'green',
    fontSize: scale(30),
    fontWeight: 'bold',
    marginBottom: scale(2),
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: scale(20),
    borderRadius: scale(10),
    width: '80%',
    alignItems: 'center',
  },
});

export default Dashboard;
