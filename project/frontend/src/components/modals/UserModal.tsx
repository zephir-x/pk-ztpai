import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userService } from '../../api/userService';
import { type UserResponse, UserRole } from '../../types/api';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (user: UserResponse, isEdit: boolean) => void;
    initialData?: UserResponse | null;
}

export const UserModal = ({ isOpen, onClose, onSaved, initialData }: UserModalProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.User);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEmail(initialData?.email || '');
            setPassword(''); // Never pre-fill password for security
            setConfirmPassword('');
            
            // Map string 'Admin' or 'User' from backend to Enum if needed
            let parsedRole: UserRole = UserRole.User;
            if (initialData?.role === 'Admin' || initialData?.role === UserRole.Admin) {
                parsedRole = UserRole.Admin;
            }
            setRole(parsedRole);
            
            setError(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (password && password !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            if (initialData) {
                // Update User
                const updateData = { email, role, password: password || undefined };
                await userService.update(initialData.id, updateData as any);
                onSaved({ ...initialData, email, role: role === UserRole.Admin ? 'Admin' : 'User' }, true);
                toast.success('The user has been updated.');
            } else {
                // Create User
                if (!password) {
                    setError("A password is required when creating a new user.");
                    setIsLoading(false);
                    return;
                }
                const createData = { email, role, password };
                const newUser = await userService.create(createData as any);
                onSaved(newUser, false);
                toast.success('The user has been successfully added.');
            }
            onClose();
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const data = err.response.data;
                if (data.errors) {
                    setError(Object.values(data.errors).flat().join(' '));
                } else {
                    setError(data.message || 'An error occurred while saving.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-matte-dark/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-matte-dark transition-colors"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-matte-dark mb-4">
                    {initialData ? 'Edit User' : 'Create New User'}
                </h3>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="input-glass"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@projecthub.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Role</label>
                        <select
                            className="input-glass bg-white"
                            value={role}
                            onChange={(e) => setRole(parseInt(e.target.value) as UserRole)}
                        >
                            <option value={UserRole.User}>User</option>
                            <option value={UserRole.Admin}>Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">
                            {initialData ? 'New Password (Optional)' : 'Password'}
                        </label>
                        <input
                            type="password"
                            className="input-glass"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={initialData ? "Leave blank to keep current" : "Min. 8 chars (A-Z, a-z, 0-9)"}
                        />
                        {initialData && <p className="text-xs text-gray-400 mt-1">If you set a new password, it will override the user's current password.</p>}
                    </div>
                    {/* Confirm Password Field - Visible when typing a new password or creating user */}
                    {(!initialData || password.length > 0) && (
                        <div>
                            <label className="block text-sm font-semibold text-matte-dark mb-1">Confirm Password</label>
                            <input
                                type="password"
                                required={!initialData || password.length > 0}
                                className={"input-glass transition-colors duration-300 " + (
                                    password && confirmPassword && password === confirmPassword 
                                        ? 'border-green-500 ring-1 ring-green-500' 
                                        : (password && password !== confirmPassword ? 'border-red-500 ring-1 ring-red-500' : '')
                                )}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    )}


                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !email.trim()}
                            className="btn-fiery"
                        >
                            {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
