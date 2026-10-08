import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Auth from './pages/Auth';

const DashboardPlaceholder = () => (
    <div className="glass-panel p-6 w-full border-t-2 border-t-fiery">
        <h3 className="text-lg font-semibold text-matte-dark mb-2">Welcome to your Workspaces</h3>
        <p className="text-gray-500 text-sm">
            This area will soon list all your available workspaces and projects fetched securely from the backend API.
        </p>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Auth Route */}
                    <Route path="/auth" element={<Auth />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/dashboard" element={<DashboardPlaceholder />} />
                            <Route path="/tasks" element={<div className="glass-panel p-6 text-gray-500">My Tasks (Coming soon)</div>} />
                            <Route path="/settings" element={<div className="glass-panel p-6 text-gray-500">Settings (Coming soon)</div>} />
                        </Route>
                    </Route>

                    {/* Fallback Redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/register" element={<Navigate to="/auth" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
