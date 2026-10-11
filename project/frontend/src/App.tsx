import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Auth from './pages/Auth';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import WorkspaceDetails from './pages/WorkspaceDetails';
import ProjectKanban from './pages/ProjectKanban';
import MyTasks from './pages/MyTasks';
import Settings from './pages/Settings';
import { Toaster } from 'react-hot-toast';

function App() {
    // Global Application State & Routing Setup
    return (
        <LanguageProvider>
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
                                <Route path="/tasks" element={<MyTasks />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>
                        </Route>

                        {/* Navigation Fallbacks */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/login" element={<Navigate to="/auth" replace />} />
                        <Route path="/register" element={<Navigate to="/auth" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
