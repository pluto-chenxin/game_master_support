import React, { useState, useEffect } from 'react';
import { Card, Typography, Tabs, Select, Spin } from 'antd';
import ReportStats from '../components/ReportStats';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Statistics = () => {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeTab, setActiveTab] = useState('reports');
  const { currentWorkspace } = useAuth();

  useEffect(() => {
    fetchGames();
  }, [currentWorkspace]); // Re-fetch when workspace changes

  const fetchGames = async () => {
    try {
      setLoading(true);
      
      // Add workspace ID to the request if it exists
      const params = new URLSearchParams();
      if (currentWorkspace) {
        params.append('workspaceId', currentWorkspace.id);
      }
      
      const url = `${config.API_URL}/api/games${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await axios.get(url);
      setGames(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setLoading(false);
    }
  };

  const handleGameChange = (value) => {
    setSelectedGame(value);
  };

  const renderGameSelector = () => (
    <div style={{ marginBottom: 16 }}>
      <Select
        placeholder="Filter by Game (Optional)"
        style={{ width: 250 }}
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
    </div>
  );

  return (
    <div className="statistics-page">
      <Title level={2}>Statistics and Analytics</Title>
      
      <Card>
        {renderGameSelector()}
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Issue Reports" key="reports">
            {loading ? (
              <Spin size="large" />
            ) : (
              <ReportStats gameId={selectedGame} workspaceId={currentWorkspace?.id} />
            )}
          </TabPane>
          {/* Additional statistics tabs can be added here in the future */}
        </Tabs>
      </Card>
    </div>
  );
};

export default Statistics; 