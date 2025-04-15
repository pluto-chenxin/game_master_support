import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Table, Button, Typography, Input, Space, Tag, 
  message, Popconfirm, Card, Spin 
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, EditOutlined, 
  DeleteOutlined, AppstoreOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const { Title } = Typography;

const GameList = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const { currentWorkspace } = useAuth();

  useEffect(() => {
    fetchGames();
  }, [currentWorkspace]);

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
    } catch (error) {
      console.error('Error fetching games:', error);
      message.error('Failed to fetch games');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/games/${id}`);
      message.success('Game deleted successfully');
      fetchGames();
    } catch (error) {
      console.error('Error deleting game:', error);
      message.error('Failed to delete game');
    }
  };

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchText.toLowerCase()) ||
    game.genre.toLowerCase().includes(searchText.toLowerCase()) ||
    (game.description && game.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <Link to={`/games/${record.id}`}>{text}</Link>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Genre',
      dataIndex: 'genre',
      key: 'genre',
      render: genre => <Tag color="blue">{genre}</Tag>,
      sorter: (a, b) => a.genre.localeCompare(b.genre),
    },
    {
      title: 'Puzzles',
      dataIndex: '_count',
      key: 'puzzles',
      render: (_count) => _count.puzzles,
      sorter: (a, b) => a._count.puzzles - b._count.puzzles,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => navigate(`/games/${record.id}`)}
          >
            Details
          </Button>
          <Popconfirm
            title="Delete this game?"
            description="This will delete all associated puzzles, hints, and maintenance records."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="game-list">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2}>
            <AppstoreOutlined /> Games
            {currentWorkspace && (
              <span style={{ fontSize: '16px', marginLeft: '10px', fontWeight: 'normal' }}>
                in {currentWorkspace.name}
              </span>
            )}
          </Title>
          <div>
            <Space>
              <Input
                placeholder="Search games..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/add-game')}
              >
                Add Game
              </Button>
            </Space>
          </div>
        </div>

        <Table
          dataSource={filteredGames}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default GameList; 