import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, setDbMode } from '../services/db';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { role: 'OWNER' | 'ADMIN', mode: 'ONLINE' | 'OFFLINE', username: string }
  const [mode, setMode] = useState(null); // 'ONLINE' | 'OFFLINE'
  const [error, setError] = useState(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('isvara_user');
    const savedMode = localStorage.getItem('isvara_mode');
    
    if (savedUser && savedMode) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setMode(savedMode);
        setDbMode(savedMode);
      } catch (e) {
        console.error("Failed to restore session", e);
        localStorage.removeItem('isvara_user');
        localStorage.removeItem('isvara_mode');
      }
    }
  }, []);

  const saveSession = (userData, modeData) => {
    localStorage.setItem('isvara_user', JSON.stringify(userData));
    localStorage.setItem('isvara_mode', modeData);
  };

  const loginOffline = async () => {
    setDbMode('OFFLINE');
    // Offline mode defaults to Owner-like privileges locally or a generic 'Local User'
    // But we can check local db if we want more strictness.
    // For now, keep "Local Owner" behavior but use db if available.
    try {
        // Try to get 'owner' from local DB
        const owner = await db.users.getByUsername('owner');
        let userData;
        if (owner) {
            userData = { 
                role: owner.role, 
                mode: 'OFFLINE', 
                username: owner.username 
            };
        } else {
             // Fallback if db is empty
            userData = { role: 'OWNER', mode: 'OFFLINE', username: 'Local Owner' };
        }
        setUser(userData);
        setMode('OFFLINE');
        saveSession(userData, 'OFFLINE');
        setError(null);
        return true; // Indicate success
    } catch (err) {
        console.error("Offline login error", err);
        // Fallback
        const userData = { role: 'OWNER', mode: 'OFFLINE', username: 'Local Owner' };
        setUser(userData);
        setMode('OFFLINE');
        saveSession(userData, 'OFFLINE');
        return true; // Indicate success
    }
  };

  const loginOnline = async (username, password) => {
    setDbMode('ONLINE');
    try {
        setError(null);
        // Fetch user from DB (Supabase if online)
        const userRecord = await db.users.getByUsername(username);
        
        if (!userRecord) {
            setError('Username tidak ditemukan.');
            setDbMode(null); // Reset if login fails
            return false;
        }

        // Verify password (simple check for now, can be upgraded to hash)
        if (userRecord.password !== password) {
            setError('Password salah.');
            setDbMode(null); // Reset if login fails
            return false;
        }

        const userData = { 
          role: userRecord.role, 
          mode: 'ONLINE', 
          username: userRecord.username 
        };
        
        setUser(userData);
        setMode('ONLINE');
        saveSession(userData, 'ONLINE');
        return true; // Indicate success

    } catch (err) {
        console.error("Login failed:", err);
        setError('Gagal login: ' + (err.message || 'Server error'));
        setDbMode(null); // Reset if login fails
        return false;
    }
  };

  const logout = () => {
    setUser(null);
    setMode(null);
    setError(null);
    setDbMode(null);
    localStorage.removeItem('isvara_user');
    localStorage.removeItem('isvara_mode');
    
    // Trigger IPC to switch windows back
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('logout-success');
    }
  };

  return (
    <AuthContext.Provider value={{ user, mode, error, loginOffline, loginOnline, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
