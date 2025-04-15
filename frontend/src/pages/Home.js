import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Statistic, Table, Typography, Spin, Alert, Button } from 'antd';
import { AppstoreOutlined, BlockOutlined, BulbOutlined, ToolOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const { Title } = Typography;

const Home = () => {
  const { user, currentWorkspace, loading: authLoading, initialized } = useAuth();
  const [stats, setStats] = useState({
    totalGames: 0,
    totalPuzzles: 0,
    totalHints: 0,
    totalMaintenance: 0
  });
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Function to fetch dashboard data - wrapped in useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current workspace ID from the currentWorkspace object
      const workspaceId = currentWorkspace?.id;
      
      // Debug information
      const debug = {
        userExists: !!user,
        workspaceExists: !!currentWorkspace,
        workspaceId: workspaceId || 'none',
        authInitialized: initialized
      };
      setDebugInfo(debug);
      
      console.log('Home dashboard fetching data with:', debug);
      
      if (!workspaceId) {
        console.log('[Dashboard] No workspace ID available, clearing stats');
        setStats({
          totalGames: 0,
          totalPuzzles: 0,
          totalHints: 0,
          totalMaintenance: 0
        });
        setRecentGames([]);
        setLoading(false);
        return;
      }
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      
      // Ensure auth token is in header for this request
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.headers.common['X-Workspace-ID'] = workspaceId.toString();
      }
      
      // Fetch games for statistics with workspace filter
      console.log(`[Dashboard] Fetching games for workspace ${workspaceId}`);
      const gamesResponse = await axios.get(`http://localhost:5000/api/games?workspaceId=${workspaceId}&_=${timestamp}`);
      const games = gamesResponse.data;
      console.log(`[Dashboard] Received ${games.length} games`);
      
      // Get total number of puzzles
      let puzzlesCount = 0;
      
      // For recent games we'll use the latest 5 games
      const sortedGames = [...games].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 5);
      
      // Transform for table display
      const recentGamesData = sortedGames.map(game => ({
        key: game.id,
        id: game.id,
        name: game.name,
        platform: game.platform || '-',
        puzzles: game._count.puzzles,
        createdAt: new Date(game.createdAt).toLocaleDateString()
      }));
      
      // Calculate puzzle count
      games.forEach(game => {
        puzzlesCount += game._count.puzzles;
      });
      
      // Fetch total hint count with workspace filter
      console.log(`[Dashboard] Fetching hints for workspace ${workspaceId}`);
      const hintsCountResponse = await axios.get(`http://localhost:5000/api/hints?workspaceId=${workspaceId}&_=${timestamp}`);
      const hintsCount = hintsCountResponse.data.length;
      console.log(`[Dashboard] Received ${hintsCount} hints`);
      
      // Fetch maintenance count with workspace filter
      console.log(`[Dashboard] Fetching maintenance for workspace ${workspaceId}`);
      const maintenanceCountResponse = await axios.get(`http://localhost:5000/api/maintenance?workspaceId=${workspaceId}&_=${timestamp}`);
      const maintenanceCount = maintenanceCountResponse.data.length;
      console.log(`[Dashboard] Received ${maintenanceCount} maintenance records`);
      
      setStats({
        totalGames: games.length,
        totalPuzzles: puzzlesCount,
        totalHints: hintsCount,
        totalMaintenance: maintenanceCount
      });
      
      setRecentGames(recentGamesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard data. Please try again later.');
      setLoading(false);
    }
  }, [initialized, currentWorkspace, user]); // Include dependencies here

  // Effect to fetch data when auth and workspace are ready
  useEffect(() => {
    if (initialized) {
      fetchData();
    }
  }, [initialized, fetchData]); // Include fetchData in dependencies

  const columns = [
    {
      title: 'Game Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <Link to={`/games/${record.id}`}>{text}</Link>,
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: 'Puzzles',
      dataIndex: 'puzzles',
      key: 'puzzles',
    },
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  // Show loading when either auth is loading or our data is loading
  if (authLoading || (loading && !error)) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      
      {error && (
        <Alert
          message="Error Loading Data"
          description={
            <>
              {error}
              <div style={{ marginTop: '10px' }}>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={fetchData}
                >
                  Retry
                </Button>
              </div>
            </>
          }
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      
      {debugInfo && debugInfo.workspaceId === 'none' && (
        <Alert
          message="No Workspace Selected"
          description="Please select a workspace to view dashboard data."
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic 
              title="Total Games" 
              value={stats.totalGames} 
              prefix={<AppstoreOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic 
              title="Total Puzzles" 
              value={stats.totalPuzzles} 
              prefix={<BlockOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic 
              title="Total Hints" 
              value={stats.totalHints} 
              prefix={<BulbOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic 
              title="Maintenance Records" 
              value={stats.totalMaintenance} 
              prefix={<ToolOutlined />} 
            />
          </Card>
        </Col>
      </Row>
      
      <Card 
        title="Recent Games" 
        style={{ marginBottom: 24 }}
        extra={
          <Button 
            type="link" 
            icon={<ReloadOutlined />} 
            onClick={fetchData}
          >
            Refresh
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={recentGames} 
          pagination={false} 
          locale={{ emptyText: 'No games added yet' }}
        />
      </Card>
      
      <Row>
        <Col span={24} style={{ textAlign: 'center' }}>
          <Link to="/add-game">
            <Title level={4} style={{ color: '#1890ff' }}>+ Add a new game</Title>
          </Link>
        </Col>
      </Row>
    </div>
  );
};

export default Home; 