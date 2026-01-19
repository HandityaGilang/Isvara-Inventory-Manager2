
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const PRODUCTS_KEY = 'isvara_products';
const SALES_KEY = 'isvara_sales_records';
const LOGS_KEY = 'isvara_activity_log';
const CATEGORY_KEY = 'isvara_categories';
const CHANNEL_KEY = 'isvara_channels';
const USERS_KEY = 'isvara_users';

let forcedMode = null; // 'OFFLINE' | 'ONLINE' | null

export const setDbMode = (mode) => {
  forcedMode = mode;
  console.log(`DB Mode set to: ${mode}`);
};

// Helper to check if we should use Supabase
const useSupabase = () => {
  if (forcedMode === 'OFFLINE') return false;
  if (forcedMode === 'ONLINE') return isSupabaseConfigured();
  return isSupabaseConfigured();
};

export const db = {
  products: {
    getAll: async () => {
      if (useSupabase()) {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        return data;
      } else {
        const stored = localStorage.getItem(PRODUCTS_KEY);
        return stored ? JSON.parse(stored) : [];
      }
    },
    
    save: async (product) => {
      if (useSupabase()) {
        // If it has an ID, upsert. If not, insert.
        // Supabase upsert requires the primary key to be present to update
        const { data, error } = await supabase
          .from('products')
          .upsert(product)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        const index = products.findIndex(p => p.id === product.id);
        
        let savedProduct;
        if (index >= 0) {
          products[index] = product;
          savedProduct = product;
        } else {
          savedProduct = { ...product, id: product.id || Date.now().toString() };
          products.push(savedProduct);
        }
        
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        return savedProduct;
      }
    },

    saveBulk: async (productsToSave) => {
      if (useSupabase()) {
        const { data, error } = await supabase
          .from('products')
          .upsert(productsToSave)
          .select();
        if (error) throw error;
        return data;
      } else {
        const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        const productMap = new Map(products.map(p => [p.id, p]));
        
        productsToSave.forEach(p => {
           // Ensure ID exists
           const id = p.id || Date.now().toString() + Math.random().toString().slice(2);
           productMap.set(id, { ...p, id });
        });
        
        const newProducts = Array.from(productMap.values());
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
        return newProducts;
      }
    },
    
    delete: async (id) => {
      if (useSupabase()) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } else {
        const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        const newProducts = products.filter(p => p.id !== id);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
      }
    },

    uploadImage: async (file) => {
      if (useSupabase()) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return data.publicUrl;
      } else {
        // Local mode: convert to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
      }
    }
  },
  
  sales: {
    getAll: async () => {
      if (useSupabase()) {
        const { data, error } = await supabase
          .from('sales_records')
          .select('*')
          .order('date', { ascending: false });
        if (error) throw error;
        return data;
      } else {
        const stored = localStorage.getItem(SALES_KEY);
        return stored ? JSON.parse(stored) : [];
      }
    },
    
    add: async (sale) => {
      if (useSupabase()) {
        const { data, error } = await supabase
          .from('sales_records')
          .insert(sale)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sales = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
        const newSale = { ...sale, id: sale.id || Date.now().toString() };
        sales.unshift(newSale);
        localStorage.setItem(SALES_KEY, JSON.stringify(sales));
        return newSale;
      }
    },

    restore: async (salesRecords) => {
      if (useSupabase()) {
         const { error } = await supabase.from('sales_records').upsert(salesRecords);
         if (error) throw error;
      } else {
        localStorage.setItem(SALES_KEY, JSON.stringify(salesRecords));
      }
    }
  },
  
  logs: {
    getAll: async () => {
      if (useSupabase()) {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data;
      } else {
        const stored = localStorage.getItem(LOGS_KEY);
        return stored ? JSON.parse(stored) : [];
      }
    },
    
    add: async (log) => {
      if (useSupabase()) {
        // Map camelCase to snake_case if needed, or ensure table matches
        const dbLog = {
          timestamp: log.timestamp,
          date: log.date,
          user_name: log.user,
          user_role: log.role,
          action: log.action,
          item: log.item,
          old_val: JSON.stringify(log.oldVal),
          new_val: JSON.stringify(log.newVal),
          source: log.source
        };
        
        const { error } = await supabase.from('activity_logs').insert(dbLog);
        if (error) console.error('Supabase log error:', error);
      } else {
        const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
        const newLog = { ...log, id: log.id || Date.now().toString() };
        const updated = [newLog, ...logs].slice(0, 200);
        localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
      }
    },

    restore: async (logs) => {
      if (useSupabase()) {
         // Transform logs if needed, assuming logs are in local format
         const dbLogs = logs.map(log => ({
            timestamp: log.timestamp,
            date: log.date,
            user_name: log.user,
            user_role: log.role,
            action: log.action,
            item: log.item,
            old_val: typeof log.oldVal === 'string' ? log.oldVal : JSON.stringify(log.oldVal),
            new_val: typeof log.newVal === 'string' ? log.newVal : JSON.stringify(log.newVal),
            source: log.source
         }));
         const { error } = await supabase.from('activity_logs').upsert(dbLogs);
         if (error) throw error;
      } else {
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
      }
    }
  },

  settings: {
    getCategories: async () => {
      // Currently local-only. Extend to Supabase if a 'settings' table is added.
      const stored = localStorage.getItem(CATEGORY_KEY);
      return stored ? JSON.parse(stored) : null;
    },
    saveCategories: async (categories) => {
      localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
      return categories;
    },
    getChannels: async () => {
      const stored = localStorage.getItem(CHANNEL_KEY);
      return stored ? JSON.parse(stored) : null;
    },
    saveChannels: async (channels) => {
      localStorage.setItem(CHANNEL_KEY, JSON.stringify(channels));
      return channels;
    }
  },

  users: {
    getAll: async () => {
      if (useSupabase()) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
      } else {
        const stored = localStorage.getItem(USERS_KEY);
        // Default owner for offline if empty
        if (!stored) {
          const defaultUsers = [{ username: 'owner', password: 'owner123', role: 'OWNER' }];
          localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
          return defaultUsers;
        }
        return JSON.parse(stored);
      }
    },

    getByUsername: async (username) => {
      if (useSupabase()) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
        // If not found, data is null or error is PGRST116
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      } else {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        // Fallback default owner
        if (users.length === 0 && username === 'owner') {
             return { username: 'owner', password: 'owner123', role: 'OWNER' };
        }
        return users.find(u => u.username === username);
      }
    },

    save: async (user) => {
      if (useSupabase()) {
        const { data, error } = await supabase
          .from('users')
          .upsert(user)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const index = users.findIndex(u => u.username === user.username);
        
        let savedUser;
        if (index >= 0) {
          users[index] = { ...users[index], ...user };
          savedUser = users[index];
        } else {
          savedUser = { ...user, created_at: new Date().toISOString() };
          users.push(savedUser);
        }
        
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return savedUser;
      }
    },

    delete: async (username) => {
      if (useSupabase()) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('username', username);
        if (error) throw error;
      } else {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const newUsers = users.filter(u => u.username !== username);
        localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
      }
    }
  }
};
