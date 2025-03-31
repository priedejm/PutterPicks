import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const username = await AsyncStorage.getItem('username');
      if (username) {
        setIsLoggedIn(true);
      }
    };
    checkUserLoggedIn();
  }, []);

  const login = async (username) => {
    await AsyncStorage.setItem('username', username);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('username');
    setIsLoggedIn(false);
  };

  return (
    <UserContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
