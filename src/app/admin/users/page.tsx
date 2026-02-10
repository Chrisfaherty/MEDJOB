'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Shield, Trash2, ArrowLeft, UserCog } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseUserAPI } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    if (!isAdmin) {
      alert('Access denied. Admin privileges required.');
      router.push('/');
      return;
    }

    loadUsers();
  }, [user, authLoading, isAdmin, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await supabaseUserAPI.getAllUsers();
      setUsers(allUsers as UserProfile[]);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will remove all their data.')) return;

    try {
      const success = await supabaseUserAPI.deleteUser(userId);
      if (success) {
        await loadUsers();
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      const success = await supabaseUserAPI.updateUserRole(userId, newRole);
      if (success) {
        await loadUsers();
        alert(`User role updated to ${newRole}`);
      } else {
        alert('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  // Show loading state while auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-linkedin-blue mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-linkedin-blue hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserCog className="w-8 h-8 text-linkedin-blue" />
            User Management
          </h1>
          <p className="text-slate-600 mt-2">Manage user accounts and permissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-slate-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Admins</p>
            <p className="text-3xl font-bold text-linkedin-blue">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Regular Users</p>
            <p className="text-3xl font-bold text-green-600">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">All Users</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-linkedin-blue mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            user.role === 'admin' ? 'bg-linkedin-blue' : 'bg-green-600'
                          }`}>
                            {user.role === 'admin' ? (
                              <Shield className="w-4 h-4 text-white" />
                            ) : (
                              <User className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-600">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-linkedin-blue text-white'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(user.created_at).toLocaleDateString('en-IE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(user.id, user.role)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-linkedin-blue text-white hover:bg-linkedin-blue-dark'
                            }`}
                            disabled={user.id === user.id}
                            title={user.id === user.id ? 'Cannot change your own role' : ''}
                          >
                            {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            disabled={user.id === user.id}
                            title={user.id === user.id ? 'Cannot delete yourself' : 'Delete user'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Admin Panel Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Admins have full access to scraper controls and user management</li>
            <li>• Regular users can view jobs, save favorites, and track applications</li>
            <li>• Admin emails are configured in the database trigger (check NEXT_PUBLIC_ADMIN_EMAILS)</li>
            <li>• Users are created automatically when they sign up via Supabase Auth</li>
            <li>• You cannot change your own role or delete yourself</li>
            <li>• User management uses Supabase for proper permission handling</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
