import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';
import PuzzleDetail from './pages/PuzzleDetail';
import AddGame from './pages/AddGame';
import AddPuzzle from './pages/AddPuzzle';
import EditGame from './pages/EditGame';
import Reports from './pages/Reports';
import Statistics from './pages/Statistics';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkspaceSelector from './pages/WorkspaceSelector';
import WorkspaceSettings from './pages/WorkspaceSettings';
import InvitationAccept from './pages/InvitationAccept';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const { Content, Footer } = Layout;

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Layout className="layout" style={{ minHeight: '100vh' }}>
            <Navbar />
            <Content style={{ padding: '0 50px', marginTop: 64 }}>
              <div className="site-layout-content" style={{ padding: 24, minHeight: 380 }}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="/invitations/:token" element={<InvitationAccept />} />
                  
                  {/* Authenticated routes that don't require a workspace */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/workspaces" element={<WorkspaceSelector />} />
                    
                    {/* Workspace required routes */}
                    <Route element={<ProtectedRoute requireWorkspace />}>
                      <Route path="/games" element={<GameList />} />
                      <Route path="/games/:id" element={<GameDetail />} />
                      <Route path="/games/:id/edit" element={<EditGame />} />
                      <Route path="/puzzles/:id" element={<PuzzleDetail />} />
                      <Route path="/add-game" element={<AddGame />} />
                      <Route path="/games/:id/add-puzzle" element={<AddPuzzle />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/statistics" element={<Statistics />} />
                      <Route path="/workspace-settings" element={<WorkspaceSettings />} />
                    </Route>
                  </Route>
                </Routes>
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
              Game Master Support ©{new Date().getFullYear()} Created with React & Ant Design
            </Footer>
          </Layout>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App; 