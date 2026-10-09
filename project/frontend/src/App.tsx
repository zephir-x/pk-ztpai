import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Auth from './pages/Auth';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import WorkspaceDetails from './pages/WorkspaceDetails';
import ProjectKanban from './pages/ProjectKanban';
import { Toaster } from 'react-hot-toast';

function App() {
    // Global Application State & Routing Setup
    return (
        <AuthProvider>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#374151',
                        color: '#fff',
                        borderRadius: '8px',
                    },
                    error: {
                        style: {
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                        },
                    },
                }}
            />
            <Router>
                <Routes>
                    {/* Public Endpoints */}
                    <Route path="/auth" element={<Auth />} />

                    {/* Secured Application Shell */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/admin" element={<AdminPanel />} />
                            <Route path="/workspace/:workspaceId" element={<WorkspaceDetails />} />
                            <Route path="/projects/:projectId" element={<ProjectKanban />} />
                            <Route path="/tasks" element={<div className="glass-panel p-6 text-gray-500">My Tasks (Coming soon)</div>} />
                            <Route path="/settings" element={<div className="glass-panel p-6 text-gray-500">Settings (Coming soon)</div>} />
                        </Route>
                    </Route>

                    {/* Navigation Fallbacks */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/register" element={<Navigate to="/auth" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
