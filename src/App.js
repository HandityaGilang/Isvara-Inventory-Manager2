import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import ProductForm from './components/ProductForm';
import ImportExport from './components/ImportExport';
import ProfitCalculator from './components/ProfitCalculator';
import ActivityLog from './components/ActivityLog';
import Sales from './components/Sales';
import FloatingCalculatorButton from './components/FloatingCalculatorButton';
import CalculatorModal from './components/CalculatorModal';
import LoginScreen from './components/LoginScreen';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const { user } = useAuth();
  const [databaseInitialized, setDatabaseInitialized] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorData, setCalculatorData] = useState({});

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Database initialization akan dilakukan melalui IPC dengan Electron
        // Untuk sementara kita set langsung true untuk development
        setDatabaseInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  const openCalculator = (data = {}) => {
    setCalculatorData(data);
    setIsCalculatorOpen(true);
  };

  const closeCalculator = () => {
    setIsCalculatorOpen(false);
    setCalculatorData({});
  };

  const handleCalculatorDataUpdate = (data) => {
    setCalculatorData(data);
  };

  if (!databaseInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-navy-950 transition-colors duration-300">
        <Sidebar user={user} />
        <div className="flex-1 overflow-auto min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/add-product" element={<ProductForm onOpenCalculator={openCalculator} />} />
            <Route path="/edit-product/:id" element={<ProductForm onOpenCalculator={openCalculator} />} />
            <Route path="/import-export" element={<ImportExport />} />
            <Route path="/profit-calculator" element={<ProfitCalculator />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </div>
        
        <FloatingCalculatorButton onClick={() => openCalculator()} />
        <CalculatorModal
          isOpen={isCalculatorOpen}
          onClose={closeCalculator}
          initialData={calculatorData}
          onDataUpdate={handleCalculatorDataUpdate}
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
