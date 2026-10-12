import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Auth from './pages/Auth';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import WorkspaceDetails from './pages/WorkspaceDetails';
import ProjectKanban from './pages/ProjectKanban';
import MyTasks from './pages/MyTasks';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import { Toaster } from 'react-hot-toast';

function App() {
    // Global Application State & Routing Setup with Glassmorphism Theme
    return (
        <LanguageProvider>
            <AuthProvider>
                <NotificationProvider>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: 'rgba(26, 33, 39, 0.94)',
                                color: '#f1f5f9',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '12px',
                                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                padding: '12px 16px',
                                fontSize: '14px',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#ffffff',
                                },
                                style: {
                                    border: '1px solid rgba(52, 211, 153, 0.35)',
                                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#ffffff',
                                },
                                style: {
                                    border: '1px solid rgba(248, 113, 113, 0.35)',
                                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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
                                    <Route path="/tasks" element={<MyTasks />} />
                                    <Route path="/notifications" element={<Notifications />} />
                                    <Route path="/settings" element={<Settings />} />
                                </Route>
                            </Route>

                            {/* Navigation Fallbacks */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/login" element={<Navigate to="/auth" replace />} />
                            <Route path="/register" element={<Navigate to="/auth" replace />} />
                        </Routes>
                    </Router>
                </NotificationProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
