import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tags, Share2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

const CATEGORY_STORAGE_KEY = 'isvara_categories';
const CHANNEL_STORAGE_KEY = 'isvara_channels';

const defaultCategories = ['Kaos', 'Kemeja', 'Jaket', 'Celana', 'Dress', 'Aksesoris'];
const defaultChannels = ['Shopee', 'Tokopedia', 'Zalora', 'Website', 'Offline Store'];

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      user &&
      user.role !== 'OWNER' &&
      user.role !== 'ADMIN' &&
      user.mode !== 'OFFLINE'
    ) {
      navigate('/');
    }
  }, [user, navigate]);

  const [categories, setCategories] = useState(defaultCategories);
  const [channels, setChannels] = useState(defaultChannels);
  const [newCategory, setNewCategory] = useState('');
  const [newChannel, setNewChannel] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [loadedCategories, loadedChannels] = await Promise.all([
          db.settings.getCategories(),
          db.settings.getChannels()
        ]);

        if (loadedCategories && Array.isArray(loadedCategories) && loadedCategories.length > 0) {
          setCategories(loadedCategories);
        }

        if (loadedChannels && Array.isArray(loadedChannels) && loadedChannels.length > 0) {
          setChannels(loadedChannels);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const saveCategories = async (items) => {
    setCategories(items);
    await db.settings.saveCategories(items);
  };

  const saveChannels = async (items) => {
    setChannels(items);
    await db.settings.saveChannels(items);
  };

  const handleAddCategory = () => {
    const value = newCategory.trim();
    if (!value) return;
    if (categories.includes(value)) {
      setNewCategory('');
      return;
    }
    const updated = [...categories, value];
    saveCategories(updated);
    setNewCategory('');
  };

  const handleRemoveCategory = (item) => {
    const updated = categories.filter(c => c !== item);
    saveCategories(updated);
  };

  const handleAddChannel = () => {
    const value = newChannel.trim();
    if (!value) return;
    if (channels.includes(value)) {
      setNewChannel('');
      return;
    }
    const updated = [...channels, value];
    saveChannels(updated);
    setNewChannel('');
  };

  const handleRemoveChannel = (item) => {
    const updated = channels.filter(c => c !== item);
    saveChannels(updated);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-yellow-50 mb-2">Pengaturan Master Data</h1>
      <p className="text-gray-600 dark:text-navy-200 mb-6">
        Kelola daftar kategori produk dan channel distribusi yang digunakan di form dan dashboard.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-5 border border-gray-100 dark:border-navy-700">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 mr-2">
              <Tags size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Kategori Produk</h2>
              <p className="text-xs text-gray-500 dark:text-navy-300">Digunakan pada form produk</p>
            </div>
          </div>

          <div className="flex mb-3 space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Tambah kategori baru"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-xs"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="ml-2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-navy-400">Belum ada kategori. Tambahkan minimal satu.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-5 border border-gray-100 dark:border-navy-700">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50 mr-2">
              <Share2 size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Channel Distribusi</h2>
              <p className="text-xs text-gray-500 dark:text-navy-300">Contoh: Shopee, Zalora, Offline Store</p>
            </div>
          </div>

          <div className="flex mb-3 space-x-2">
            <input
              type="text"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="Tambah channel baru"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
            />
            <button
              type="button"
              onClick={handleAddChannel}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => (
              <span
                key={ch}
                className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 text-xs"
              >
                {ch}
                <button
                  type="button"
                  onClick={() => handleRemoveChannel(ch)}
                  className="ml-2 text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-200"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
            {channels.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-navy-400">Belum ada channel. Tambahkan minimal satu.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
