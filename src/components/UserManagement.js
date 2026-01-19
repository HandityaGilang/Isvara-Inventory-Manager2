import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Edit2, Trash2, Save, X, Shield, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Security check: Only OWNER can access
  useEffect(() => {
    if (user && user.role !== 'OWNER') {
      navigate('/');
    }
  }, [user, navigate]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'STAFF'
  });
  
  const roles = ['OWNER', 'ADMIN', 'STAFF'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await db.users.getAll();
      setUsers(data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'STAFF'
    });
    setIsEditing(false);
  };

  const handleEdit = (userToEdit) => {
    setFormData({
      username: userToEdit.username,
      password: userToEdit.password, // Showing password might not be secure in prod, but ok for simple apps
      role: userToEdit.role
    });
    setIsEditing(true);
  };

  const handleDelete = async (username) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${username}"?`)) {
      try {
        await db.users.delete(username);
        loadUsers();
      } catch (err) {
        console.error("Failed to delete user:", err);
        setError("Gagal menghapus pengguna.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError("Username dan Password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      await db.users.save(formData);
      await loadUsers();
      resetForm();
    } catch (err) {
      console.error("Failed to save user:", err);
      setError("Gagal menyimpan pengguna. Pastikan username unik.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" />
            Manajemen Pengguna
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola akun pengguna dan hak akses aplikasi.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {isEditing ? <Edit2 size={20} /> : <UserPlus size={20} />}
              {isEditing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    disabled={isEditing} // Cannot change username when editing
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isEditing ? 'bg-gray-100 text-gray-500' : 'border-gray-300'}`}
                    placeholder="Masukkan username"
                  />
                </div>
                {isEditing && <p className="text-xs text-gray-500 mt-1">Username tidak dapat diubah.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role (Hak Akses)
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Password</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        Belum ada data pengguna.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.username} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {u.username}
                          {u.username === user?.username && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${u.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 
                              u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-sm">
                          {u.password}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            {u.username !== 'owner' && u.username !== user?.username && (
                              <button
                                onClick={() => handleDelete(u.username)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
