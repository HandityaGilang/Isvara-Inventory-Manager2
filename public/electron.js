const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { 
  initDatabase,
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductsByStatus,
  getDashboardStats,
  closeDatabase
} = require('../src-electron/database/db');


const isDev = !app.isPackaged;

let mainWindow;
let loginWindow;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.ico')
  });
  
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    show: false,
    frame: false, // Frameless login window
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: "Isvara Login"
  });

  const buildPath = path.join(__dirname, '../build/index.html');
  
  if (isDev) {
    loginWindow.loadURL('http://localhost:3000');
  } else {
    loginWindow.loadFile(buildPath);
  }
    
  loginWindow.once('ready-to-show', () => {
     if (splashWindow && !splashWindow.isDestroyed()) {
       splashWindow.close();
       splashWindow = null;
     }
     loginWindow.show();
  });

  if (isDev) {
    // loginWindow.webContents.openDevTools();
  }

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: "Isvara Inventory Manager"
  });

  mainWindow.setMenu(null);

  const buildPath = path.join(__dirname, '../build/index.html');
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(buildPath);
  }
    
  mainWindow.once('ready-to-show', () => {
     mainWindow.maximize();
     mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC listener for successful login
ipcMain.on('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
  }
  createMainWindow();
});

// IPC listener for logout
ipcMain.on('logout-success', () => {
  if (mainWindow) {
    mainWindow.close();
  }
  createLoginWindow();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  dialog.showErrorBox(
    'Isvara Inventory Manager',
    'Aplikasi sudah terbuka di jendela lain.\nSilakan cek taskbar atau tray.'
  );
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else if (loginWindow) {
      if (loginWindow.isMinimized()) loginWindow.restore();
      loginWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createSplashWindow();
    createLoginWindow(); // Start with Login Window
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createLoginWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  closeDatabase();
});

// Initialize database
ipcMain.handle('init-database', async () => {
  try {
    await initDatabase();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Import database functions


// IPC handlers for database operations
ipcMain.handle('get-all-products', async () => {
  try {
    const products = await getAllProducts();
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-product', async (event, id) => {
  try {
    const product = await getProductById(id);
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-product', async (event, productData) => {
  try {
    const result = await addProduct(productData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-product', async (event, id, productData) => {
  try {
    const result = await updateProduct(id, productData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-product', async (event, id) => {
  try {
    await deleteProduct(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-products-by-status', async (event, status) => {
  try {
    const products = await getProductsByStatus(status);
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-dashboard-stats', async () => {
  try {
    const stats = await getDashboardStats();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Excel Import handler
ipcMain.handle('import-excel', async (event, filePath) => {
  try {
    const result = await importFromExcel(filePath);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
