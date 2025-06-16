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
  Share,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Linking
} from 'react-native';
import * as Notifications from 'expo-notifications';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { onValue } from 'firebase/database';
import { getDatabase, get, ref, update, remove } from 'firebase/database';
import { app } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import LoginScreen from './Login';
import FilterTabs from './FilterTabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../context/UserContext';
import Constants from 'expo-constants';

const currentAppVersion = Constants.expoConfig?.version ?? '0.0.0';

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
  const { selectedPool, setSelectedPool } = useUser();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pools, setPools] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState({});
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const poolsRef = ref(database, 'pools');
    const unsubscribe = onValue(poolsRef, (snapshot) => {
      if (snapshot.exists()) {
        const poolsData = snapshot.val();
        const poolsWithImages = Object.entries(poolsData).map(([key, pool]) => ({
          ...pool,
          id: key,
          image: getNextImage(),
        }));
        console.log("Pools with images:", poolsWithImages);
        setPools(poolsWithImages);
      } else {
        setPools([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkStoredUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setUser(parsedUser);
        registerForPushNotificationsAsync(parsedUser);
      }
      setLoading(false);
    };
    checkStoredUser();
  }, [isLoggedIn]);

  useFocusEffect(
    React.useCallback(() => {
      closeAllDropdowns();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      const latestVersionRef = ref(database, 'featureflags/latestVersion');
      const unsubscribe = onValue(latestVersionRef, (snapshot) => {
        if (snapshot.exists()) {
          console.log("latestVersion", snapshot.val(), "and", currentAppVersion);
          if (isVersionGreater(snapshot.val(), currentAppVersion) > 0) {
            setUpdateModalVisible(true);
          }
        }
      });
  
      return () => unsubscribe();
    }, [])
  );  

  const isVersionGreater = (v1, v2) => {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const a = v1Parts[i] || 0;
      const b = v2Parts[i] || 0;
      if (a > b) return true;
      if (a < b) return false;
    }
    return false;
  };
  

  const registerForPushNotificationsAsync = async (currentUser) => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log("doing stuff")
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const users = snapshot.val();
      const userEntry = Object.entries(users).find(
        ([key, user]) => user.email === currentUser.email
      );
      if (userEntry) {
        const [userId] = userEntry;
        const userRef = ref(database, `users/${userId}`);
        console.log("updateing!", token)
        await update(userRef, { expoToken: token });
      }
    }
  };

  const handleShare = async (pool) => {
    try {
      const result = await Share.share({
        message: `Join my golf pool "${pool.name}" on PutterPicks! 🏌️‍♂️\n\nMode: ${pool.mode}\n\nCheck it out with the code ${pool.shareCode}!\n\nhttps://apps.apple.com/us/app/putter-picks/id6744010889?platform=iphone`,
      });
      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  let imageQueue = shuffleArray(golfImages);

  const getNextImage = () => {
    if (imageQueue.length === 0) {
      imageQueue = shuffleArray(golfImages);
    }
    return imageQueue.pop();
  };

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

  const toggleDropdown = (poolId) => {
    setDropdownVisible((prev) => {
      const updated = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      return {
        ...updated,
        [poolId]: !prev[poolId],
      };
    });
  };

  const closeAllDropdowns = () => {
    setDropdownVisible({});
  };

  const handleDeletePool = (poolId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this pool?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          onPress: async () => {
            const poolRef = ref(database, `pools/${poolId}`);
            console.log("is there a poolRef here", poolId, poolRef);
            await remove(poolRef);
            console.log(`Pool with id ${poolId} has been deleted.`);
            setPools((prevPools) => prevPools.filter((pool) => pool.id !== poolId));
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleLeavePool = (poolId) => {
    const matchedPool = pools.find(pool => pool.id === poolId);
    const matchedUser = matchedPool.users.find(user => user.username === user?.username);

    // Alert to confirm leave
    Alert.alert(
      'Confirm Leave',
      `Are you sure you want to leave the pool: ${matchedPool.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Leave',
          onPress: async () => {
            const updatedUsers = matchedPool.users.filter(user => user.username !== matchedUser.username);
            const poolRef = ref(database, `pools/${poolId}`);
            await update(poolRef, { users: updatedUsers });
            console.log(`User ${user?.username} has left the pool: ${matchedPool.name}`);
            setPools((prevPools) =>
              prevPools.map((pool) =>
                pool.id === poolId ? { ...pool, users: updatedUsers } : pool
              )
            );
            // setSelectedPool(null); // Clear selected pool
          }
        }
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen setIsLoggedIn={setIsLoggedIn} />;
  }

  // Get user's pools
  const userPools = pools?.filter((pool) => pool.users?.some((u) => u.username === user?.username)) || [];
  
  // Show loading if pools haven't been loaded yet
  const isLoadingPools = pools === null;

  return (
    <TouchableWithoutFeedback onPress={closeAllDropdowns}>
      <View style={styles.flexContainer}>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.dashboardText}>Dashboard</Text>
            <TouchableOpacity onPress={handleLogout} style={{ paddingRight: scale(20) }}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={{ fontSize: scale(24), paddingLeft: scale(20), color: 'white', marginBottom: scale(10) }}>
            Active Pools
          </Text>

          {isLoadingPools ? (
            // Loading state while pools are being fetched
            <View style={styles.poolsLoadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading your pools...</Text>
            </View>
          ) : userPools.length === 0 ? (
            // Empty state when user has no pools
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateCard}>
                <MaterialCommunityIcons 
                  name="golf" 
                  size={scale(60)} 
                  color="#305115" 
                  style={styles.emptyStateIcon}
                />
                <Text style={styles.emptyStateTitle}>No Pools Yet!</Text>
                <Text style={styles.emptyStateDescription}>
                  You haven't joined any golf pools yet. Create your first pool or join an existing one to get started!
                </Text>
                
                <TouchableOpacity 
                  onPress={() => setModalVisible(true)} 
                  style={styles.emptyStateButton}
                >
                  <MaterialCommunityIcons name="plus" size={scale(20)} color="white" />
                  <Text style={styles.emptyStateButtonText}>Create or Join Pool</Text>
                </TouchableOpacity>
                
                <Text style={styles.emptyStateHint}>
                  Tip: Use the + button in the bottom right corner anytime!
                </Text>
              </View>
            </View>
          ) : (
            // Existing pools display
            userPools.map((pool, index) => {
              const latestTournament = pool.tournaments?.length ? pool.tournaments[pool.tournaments.length - 1] : null;
              const rosterFormat =
                pool.settings?.rosterFormat === 'tiered'
                  ? 'Tiered'
                  : pool.settings?.rosterFormat === 'salaryCap'
                  ? 'Salary Cap'
                  : null;

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    closeAllDropdowns(); // ✅ close dropdowns before navigating
                    setSelectedPool(pool);
                    navigation.navigate('Main');
                  }}
                  key={index}
                  style={{backgroundColor: 'white',padding: 10,width: scale(310),height: scale(200),alignSelf: 'center',borderRadius: scale(5),overflow: 'hidden',marginBottom: scale(20),}}
                >
                  <Image source={pool.image} style={{ width: scale(310), height: scale(200), position: 'absolute' }} />
                  <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: scale(150) }} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: scale(150) }} />

                  <TouchableOpacity onPress={() => toggleDropdown(pool.id)} style={{ position: 'absolute', right: scale(10), top: scale(5), zIndex: 2 }}>
                    <MaterialCommunityIcons name="dots-horizontal" color={'white'} size={scale(30)} />
                  </TouchableOpacity>

                  {dropdownVisible[pool.id] && (
                    <TouchableWithoutFeedback>
                      <View style={{position: 'absolute',right: scale(10),top: scale(40),backgroundColor: 'white',borderRadius: 5,padding: 5,zIndex: 3,elevation: 5,}}>
                        <TouchableOpacity onPress={() => handleShare(pool)} style={{ flexDirection: 'row', padding: 5, alignItems: 'center' }}>
                          <MaterialCommunityIcons name="share-variant" size={20} color="black" style={{ marginRight: scale(10) }} />
                          <Text>Share</Text>
                        </TouchableOpacity>               

                        <TouchableOpacity onPress={() => navigation.navigate('PoolDetails', { pool })} style={{ flexDirection: 'row', padding: 5, alignItems: 'center' }}>
                          <MaterialCommunityIcons name="eye" size={20} color="black" style={{ marginRight: scale(10) }} />
                          <Text>View Details</Text>
                        </TouchableOpacity>               

                        <TouchableOpacity onPress={() => handleLeavePool(pool.id)} style={{ flexDirection: 'row', padding: 5, alignItems: 'center' }}>
                          <MaterialCommunityIcons name="account-minus" size={20} color="black" style={{ marginRight: scale(10) }} />
                          <Text>Leave</Text>
                        </TouchableOpacity>               

                        {pool?.poolAdmin?.includes(user?.username) && (
                          <TouchableOpacity onPress={() => handleDeletePool(pool.id)} style={{ flexDirection: 'row', padding: 5, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="trash-can" size={20} color="black" style={{ marginRight: scale(10) }} />
                            <Text>Delete</Text>
                          </TouchableOpacity>
                        )}

                      </View>
                    </TouchableWithoutFeedback>
                  )}


                  {pool?.poolAdmin?.includes(user?.username) && (
                    <TouchableOpacity onPress={() => navigation.navigate('PoolSettings', { pool, pools })} style={{ position: 'absolute', right: scale(40), top: scale(5) }}>
                      <MaterialCommunityIcons name="cog-outline" color={'white'} size={scale(30)} />
                    </TouchableOpacity>
                  )}

                  <View style={{ position: 'absolute', bottom: scale(5), left: scale(5) }}>
                  <View style={{flexDirection: 'row',width: scale(310),alignItems: 'center',}} >
                    <Text style={{color: 'white',fontSize: scale(22),fontWeight: 'bold',flexShrink: 0,}} >
                      {pool.name} |
                    </Text>
                    
                    <View style={{ flex: 1, marginLeft: scale(5) }}>
                      <View style={{paddingHorizontal: scale(5),borderRadius: scale(3),alignSelf: 'flex-start',maxWidth: scale(300) - scale(120)}} >
                        <Text
                          numberOfLines={2}
                          style={{color: 'white',fontSize: scale(14),fontWeight: 'bold',top: scale(1)}}
                        >
                          {pool.mode} {rosterFormat && `- ${rosterFormat}`}
                        </Text>
                      </View>
                    </View>
                  </View>


                    <Text style={{ color: 'white', fontSize: scale(14),marginBottom: scale(4)}}>
                      👥 {pool.users?.length || 0} {pool.users?.length === 1 ? 'member' : 'members'}
                    </Text>


                    {latestTournament ? (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) }}>
                          <Text style={{ fontSize: scale(14), marginRight: scale(5) }}>🏆</Text>
                          <Text style={{ color: 'white', fontSize: scale(14) }}>{latestTournament?.name}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) }}>
                          <Text style={{ fontSize: scale(14), marginRight: scale(5) }}>💰</Text>
                          <Text style={{ color: 'white', fontSize: scale(14) }}>{formatCurrency(latestTournament?.purse)}</Text>
                        </View>
                      </>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) }}>
                        <Text style={{ fontSize: scale(14), marginRight: scale(5) }}>🏆</Text>
                        <Text style={{ color: 'white', fontSize: scale(14) }}>Tournament will be added soon...</Text>
                      </View>
                    )}

                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.floatingButton}>
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>

        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
            <View style={{ height: scale(475), width: scale(300), backgroundColor: 'white', borderRadius: 20, overflow: 'hidden' }} onStartShouldSetResponder={() => true}>
              <FilterTabs user={user} pools={pools}/>
            </View>
          </TouchableOpacity>
        </Modal>

         {/* App update modal */}
         <Modal animationType="fade" transparent={true} visible={updateModalVisible} onRequestClose={() => setUpdateModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.updateBox}>
              <Text style={styles.updateTitle}>Update Available</Text>
              <Text style={styles.updateText}>A new version of the app is available. Please update to get the latest features and fixes.</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.updateButton} onPress={() => {
                  Linking.openURL('https://apps.apple.com/pw/app/putter-picks/id6744010889')
                  .then(() => {
                    Alert.alert('Redirecting to App Store...');
                    setUpdateModalVisible(false);
                  })
                  .catch(err => {
                    console.error("Failed to open App Store link:", err);
                    Alert.alert('Failed to open the App Store.');
                  });
                  setUpdateModalVisible(false);
                }}>
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.okButton} onPress={() => setUpdateModalVisible(false)}>
                  <Text style={styles.okButtonText}>Okay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  flexContainer: { flex: 1, backgroundColor: '#305115' },
  container: { flex: 1, backgroundColor: '#305115' },
  header: {
    marginTop: scale(50),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: scale(20),
    marginBottom: scale(10),
  },
  dashboardText: { fontSize: scale(30), color: 'white', fontWeight: 'bold' },
  logoutText: { fontSize: scale(16), color: 'white' },
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
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: scale(20),
    marginTop: scale(40),
  },
  emptyStateCard: {
    backgroundColor: 'white',
    borderRadius: scale(15),
    padding: scale(30),
    alignItems: 'center',
    width: scale(310),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateIcon: {
    marginBottom: scale(20),
  },
  emptyStateTitle: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#305115',
    marginBottom: scale(15),
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: scale(16),
    color: '#666',
    textAlign: 'center',
    lineHeight: scale(22),
    marginBottom: scale(25),
  },
  emptyStateButton: {
    backgroundColor: '#305115',
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: scale(16),
    fontWeight: 'bold',
    marginLeft: scale(8),
  },
  emptyStateHint: {
    fontSize: scale(14),
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Pools loading state styles
  poolsLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(60),
  },
  loadingText: {
    color: 'white',
    fontSize: scale(16),
    marginTop: scale(15),
    textAlign: 'center',
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
  updateBox: {
    width: scale(300),
    backgroundColor: 'white',
    padding: scale(20),
    borderRadius: scale(10),
    alignItems: 'center',
  },
  updateTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    marginBottom: scale(10),
  },
  updateText: {
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: scale(20),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    padding: scale(10),
    borderRadius: scale(5),
    marginRight: scale(5),
    alignItems: 'center',
  },
  okButton: {
    flex: 1,
    backgroundColor: '#aaa',
    padding: scale(10),
    borderRadius: scale(5),
    marginLeft: scale(5),
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  okButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
});

export default Dashboard;