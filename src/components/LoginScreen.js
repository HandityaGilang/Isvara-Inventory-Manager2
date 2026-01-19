import React, { useState } from 'react';
import { Wifi, WifiOff, User, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const { loginOffline, loginOnline } = useAuth();
  const [activeTab, setActiveTab] = useState('offline'); // 'offline' | 'online'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOfflineLogin = async () => {
    setLoading(true);
    // Simulate loading to allow time for firewall prompt or just to give feedback
    setTimeout(async () => {
      const success = await loginOffline();
      if (success) {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('login-success');
        }
      }
      setLoading(false);
    }, 1500);
  };

  const handleOnlineLogin = async (e) => {
    e.preventDefault();
    if (username && password) {
      setLoading(true);
      const success = await loginOnline(username, password);
      if (success) {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('login-success');
        }
      }
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      // We can send a message to close the app
      // Since we don't have a specific 'close-app' handler yet, let's add one or use window.close()
      // But window.close() in renderer might not work if contextIsolation is on (it's off here)
      window.close();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 relative draggable-region">
      {/* Custom Close Button for Frameless Window */}
      <button 
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 transition-colors z-50 no-drag"
        title="Close Application"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <style>{`
        .draggable-region {
          -webkit-app-region: drag;
        }
        button, input, a {
          -webkit-app-region: no-drag;
        }
        .no-drag {
          -webkit-app-region: no-drag;
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px] no-drag">
        <div
          className={`w-full md:w-1/2 p-12 text-white flex flex-col justify-center transition-all duration-500 ${
            activeTab === 'offline'
              ? 'bg-gradient-to-br from-gray-700 to-gray-900'
              : 'bg-gray-900/60'
          }`}
          style={
            activeTab === 'online'
              ? {
                  backgroundImage: `url(${process.env.PUBLIC_URL}/OnlineSplash.png)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}
          }
        >
          <h1 className="text-4xl font-bold mb-4">Isvara Inventory</h1>
          <p className="text-lg opacity-90 mb-8">
            {activeTab === 'offline' 
              ? 'Kelola inventory Anda secara lokal tanpa koneksi internet. Cepat, aman, dan privat.' 
              : 'Kolaborasi real-time dengan tim Anda. Pantau stok dan performa dari mana saja.'}
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('offline')}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === 'offline' ? 'bg-white text-gray-900 font-bold' : 'bg-transparent border border-white/30 hover:bg-white/10'}`}
            >
              <WifiOff size={18} className="mr-2" />
              Offline Mode
            </button>
            <button 
              onClick={() => setActiveTab('online')}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === 'online' ? 'bg-white text-blue-900 font-bold' : 'bg-transparent border border-white/30 hover:bg-white/10'}`}
            >
              <Wifi size={18} className="mr-2" />
              Online Mode
            </button>
          </div>
        </div>

        {/* Right Side: Action Forms */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white">
          {activeTab === 'offline' ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <WifiOff size={40} className="text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Offline Access</h2>
              <p className="text-gray-500 mb-8">Masuk sebagai Local Owner. Data tersimpan di perangkat ini.</p>
              <button 
                onClick={handleOfflineLogin}
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  <>
                    Masuk Dashboard Offline
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleOnlineLogin}>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wifi size={40} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Online Login</h2>
                <p className="text-gray-500">Masuk sebagai Owner, Admin, atau Staff</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Username (e.g. owner, admin, staff)"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Masuk Online...
                    </span>
                  ) : (
                    <>
                      Masuk Online
                      <ArrowRight size={20} className="ml-2" />
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Hubungi Owner untuk mendapatkan akses akun.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Watermark */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium">
        Made by HandityaGilang(Garda)
      </div>
    </div>
  );
};

export default LoginScreen;
