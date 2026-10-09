import { useEffect, useState } from 'react';
import { userService } from '../api/userService';
import { type UserResponse } from '../types/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { Shield, Mail, UserCog, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminPanel() {
    usePageTitle('Admin Panel');
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch active system users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const data = await userService.getAll();
            setUsers(data);
        } catch {
            toast.error('Failed to retrieve the user database.');
        } finally {
            setIsLoading(false);
        }
    };

    // Prevent rendering table before data completes loading
    if (isLoading) return <div className="text-gray-500 animate-pulse p-8">Loading administration panel...</div>;

    return (
        <div className="h-full flex flex-col">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark flex items-center gap-2">
                        <Shield className="text-fiery" /> System Administration
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage platform users and global settings</p>
                </div>
                <button className="btn-fiery opacity-50 cursor-not-allowed" title="Endpoint pending implementation">
                    Add User
                </button>
            </div>

            {/* Users Data Table */}
            <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100/50 border-b border-gray-200">
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Account</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white/40">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-mono text-xs text-gray-400">
                                    {user.id.substring(0, 8)}...
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-matte-dark">
                                        <Mail size={14} className="text-gray-400" />
                                        {user.email}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold " + (user.role === 'ADMIN' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200')}>
                                        {user.role === 'ADMIN' && <UserCog size={12} />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-gray-400">
                                    <button className="hover:text-fiery transition-colors p-1 rounded hover:bg-gray-200/50">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Fallback for empty state */}
                {users.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">No users found in the system.</div>
                )}
            </div>
        </div>
    );
}
