import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Select, Spin, Alert, Modal, Typography, Row, Col, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportList from '../components/ReportList';
import ReportForm from '../components/ReportForm';
import { useAuth } from '../context/AuthContext';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title } = Typography;

const Reports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentWorkspace } = useAuth();
  
  // Get tab from URL or default to 'all'
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return ['all', 'open', 'in-progress', 'resolved'].includes(tab) ? tab : 'all';
  };
  
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  const [refreshTimestamp, setRefreshTimestamp] = useState(null);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    const params = new URLSearchParams(location.search);
    
    // For tab changes, also update filter to match the tab
    params.set('tab', tab);
    
    // For tab changes, also update filter to match the tab (except for 'all')
    if (tab !== 'all') {
      params.set('filter', tab);
    } else {
      params.delete('filter');
    }
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    setActiveTab(tab);
  };
  
  // Update tab state when URL changes
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.search]);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      fetchPuzzles(selectedGame);
    } else {
      setPuzzles([]);
      setSelectedPuzzle(null);
    }
  }, [selectedGame]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      
      // Add workspace ID to the request if it exists
      const params = new URLSearchParams();
      if (currentWorkspace) {
        params.append('workspaceId', currentWorkspace.id);
      }
      
      const url = `http://localhost:5000/api/games${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url);
      setGames(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Please try again.');
      setLoading(false);
    }
  };

  const fetchPuzzles = async (gameId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/games/${gameId}/puzzles`);
      setPuzzles(response.data);
    } catch (err) {
      console.error('Error fetching puzzles:', err);
      setError('Failed to load puzzles. Please try again.');
    }
  };

  const handleGameChange = (value) => {
    setSelectedGame(value);
    setSelectedPuzzle(null);
  };

  const handlePuzzleChange = (value) => {
    setSelectedPuzzle(value);
  };

  const handleAddReport = () => {
    setReportModalVisible(true);
  };

  const handleReportSubmitted = () => {
    setReportModalVisible(false);
    // Create a timestamp to force the ReportList components to refresh
    // This will be passed to the components as a prop
    setRefreshTimestamp(Date.now());
  };

  const renderFilters = () => (
    <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
      <Select
        placeholder="Filter by Game"
        style={{ width: 200 }}
        allowClear
        onChange={handleGameChange}
        value={selectedGame}
      >
        {games.map(game => (
          <Option key={game.id} value={game.id}>
            {game.name}
          </Option>
        ))}
      </Select>

      {selectedGame && (
        <Select
          placeholder="Filter by Puzzle"
          style={{ width: 200 }}
          allowClear
          onChange={handlePuzzleChange}
          value={selectedPuzzle}
        >
          {puzzles.map(puzzle => (
            <Option key={puzzle.id} value={puzzle.id}>
              {puzzle.title}
            </Option>
          ))}
        </Select>
      )}

      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={handleAddReport}
        disabled={!selectedGame}
      >
        Add Report
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        closable
        onClose={() => setError(null)}
      />
    );
  }

  return (
    <div className="reports-page">
      <Title level={2}>Game Issue Reports</Title>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          tabBarExtraContent={renderFilters()}
        >
          <TabPane tab="All Reports" key="all">
            {selectedPuzzle ? (
              <ReportList 
                puzzleId={selectedPuzzle} 
                showGameInfo={true} 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            ) : selectedGame ? (
              <ReportList 
                gameId={selectedGame} 
                showPuzzleInfo={true} 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            ) : (
              <ReportList 
                showGameInfo={true} 
                showPuzzleInfo={true} 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            )}
          </TabPane>
          <TabPane tab="Open Issues" key="open">
            {selectedPuzzle ? (
              <ReportList 
                puzzleId={selectedPuzzle} 
                showGameInfo={true} 
                filterStatus="open" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            ) : selectedGame ? (
              <ReportList 
                gameId={selectedGame} 
                showPuzzleInfo={true} 
                filterStatus="open" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            ) : (
              <ReportList 
                showGameInfo={true} 
                showPuzzleInfo={true} 
                filterStatus="open" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            )}
          </TabPane>
          <TabPane tab="In Progress" key="in-progress">
            {selectedPuzzle ? (
              <ReportList 
                puzzleId={selectedPuzzle} 
                showGameInfo={true} 
                filterStatus="in-progress" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            ) : selectedGame ? (
              <ReportList 
                gameId={selectedGame} 
                showPuzzleInfo={true} 
                filterStatus="in-progress" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            ) : (
              <ReportList 
                showGameInfo={true} 
                showPuzzleInfo={true} 
                filterStatus="in-progress" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            )}
          </TabPane>
          <TabPane tab="Resolved Issues" key="resolved">
            {selectedPuzzle ? (
              <ReportList 
                puzzleId={selectedPuzzle} 
                showGameInfo={true} 
                filterStatus="resolved" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            ) : selectedGame ? (
              <ReportList 
                gameId={selectedGame} 
                showPuzzleInfo={true} 
                filterStatus="resolved" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            ) : (
              <ReportList 
                showGameInfo={true} 
                showPuzzleInfo={true} 
                filterStatus="resolved" 
                refreshTimestamp={refreshTimestamp}
                workspaceId={currentWorkspace?.id} 
              />
            )}
          </TabPane>
        </Tabs>

        {/* Add Report Modal */}
        <Modal
          title="Add Issue Report"
          open={reportModalVisible}
          onCancel={() => setReportModalVisible(false)}
          footer={null}
          width={700}
        >
          {selectedGame ? (
            <ReportForm 
              gameId={selectedGame}
              puzzleId={selectedPuzzle}
              onFinish={handleReportSubmitted}
              workspaceId={currentWorkspace?.id}
            />
          ) : (
            <Empty description="Please select a game first" />
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default Reports; 