import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, Tabs, Spin, Alert, Empty, Tag, Popconfirm, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, ToolOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import './GameDetail.css';
import ReportList from '../components/ReportList';
import ReportForm from '../components/ReportForm';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const statusIcons = {
  'needs_attention': <ClockCircleOutlined style={{ color: '#faad14' }} />,
  'active': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  'in_maintenance': <ToolOutlined style={{ color: '#f5222d' }} />
};

const statusColors = {
  'needs_attention': 'warning',
  'active': 'success',
  'in_maintenance': 'error'
};

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clickedPuzzleId, setClickedPuzzleId] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState(null);

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch game details
        const gameResponse = await axios.get(`http://localhost:5000/api/games/${id}`);
        setGame(gameResponse.data);
        
        // Fetch puzzles for this game
        const puzzlesResponse = await axios.get(`http://localhost:5000/api/games/${id}/puzzles`);
        setPuzzles(puzzlesResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching game details:', error);
        setError('Failed to load game details. Please try again later.');
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [id]);

  const handleDeleteGame = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/games/${id}`);
      message.success('Game deleted successfully');
      navigate('/games');
    } catch (error) {
      console.error('Error deleting game:', error);
      message.error('Failed to delete game');
    }
  };

  const handlePuzzleClick = (puzzleId) => {
    // Set the clicked puzzle ID to trigger animation
    setClickedPuzzleId(puzzleId);
    
    // Navigate after a short delay to allow animation to play
    setTimeout(() => {
      navigate(`/puzzles/${puzzleId}`);
    }, 300);
  };

  const renderPuzzleCard = (puzzle) => {
    return (
      <Col xs={24} sm={12} md={8} lg={6} key={puzzle.id}>
        <Card
          className={`puzzle-card ${clickedPuzzleId === puzzle.id ? 'puzzle-card-clicked' : ''}`}
          title={
            <div onClick={() => handlePuzzleClick(puzzle.id)} style={{ cursor: 'pointer' }}>
              {puzzle.title}
              <Tag color={statusColors[puzzle.status]} style={{ marginLeft: 8 }}>
                {statusIcons[puzzle.status]} {puzzle.status.replace('_', ' ')}
              </Tag>
            </div>
          }
          hoverable
          extra={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Tag color="blue">{puzzle.hints.length} hints</Tag>
              <Tag color="purple">
                {puzzle.maintenance.length > 0 ? `${puzzle.maintenance.length} fixes` : 'No fixes'}
              </Tag>
            </div>
          }
        >
          <div onClick={() => handlePuzzleClick(puzzle.id)} style={{ cursor: 'pointer' }}>
            <p>{puzzle.description}</p>
            <div>
              Difficulty: {[...Array(puzzle.difficulty || 1)].map((_, i) => (
                <span key={i} role="img" aria-label="star">⭐</span>
              ))}
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading game details...</p>
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
      />
    );
  }

  if (!game) {
    return <Alert message="Game not found" type="error" />;
  }

  return (
    <div>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/games')}
        style={{ marginBottom: 16, padding: 0 }}
      >
        Back to All Games
      </Button>
      
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>{game.name}</Title>
          <Text>Genre: {game.genre}</Text>
          {game.releaseDate && (
            <Text style={{ marginLeft: 16 }}>
              Released: {new Date(game.releaseDate).toLocaleDateString()}
            </Text>
          )}
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => navigate(`/games/${id}/add-puzzle`)}
          >
            Add Puzzle
          </Button>
          <Button
            icon={<EditOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => navigate(`/games/${id}/edit`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this game?"
            description="All puzzles, hints, and maintenance records will be deleted. This action cannot be undone."
            onConfirm={handleDeleteGame}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Col>
      </Row>
      
      {game.description && (
        <Card style={{ marginBottom: 24 }}>
          <div>{game.description}</div>
        </Card>
      )}
      
      <Tabs defaultActiveKey="all">
        <TabPane tab="All Puzzles" key="all">
          {puzzles.length === 0 ? (
            <Empty 
              description={
                <span>
                  No puzzles found. <Link to={`/games/${id}/add-puzzle`}>Add a puzzle</Link>
                </span>
              }
            />
          ) : (
            <Row gutter={[16, 16]}>
              {puzzles.map(puzzle => renderPuzzleCard(puzzle))}
            </Row>
          )}
        </TabPane>
        <TabPane tab="Active" key="active">
          {puzzles.filter(p => p.status === 'active').length === 0 ? (
            <Empty description="No active puzzles found" />
          ) : (
            <Row gutter={[16, 16]}>
              {puzzles.filter(p => p.status === 'active').map(puzzle => renderPuzzleCard(puzzle))}
            </Row>
          )}
        </TabPane>
        <TabPane tab="Needs Attention" key="needs_attention">
          {puzzles.filter(p => p.status === 'needs_attention').length === 0 ? (
            <Empty description="No puzzles needing attention" />
          ) : (
            <Row gutter={[16, 16]}>
              {puzzles.filter(p => p.status === 'needs_attention').map(puzzle => renderPuzzleCard(puzzle))}
            </Row>
          )}
        </TabPane>
        <TabPane tab="In Maintenance" key="in_maintenance">
          {puzzles.filter(p => p.status === 'in_maintenance').length === 0 ? (
            <Empty description="No puzzles in maintenance" />
          ) : (
            <Row gutter={[16, 16]}>
              {puzzles.filter(p => p.status === 'in_maintenance').map(puzzle => renderPuzzleCard(puzzle))}
            </Row>
          )}
        </TabPane>
        <TabPane tab="Reports" key="reports">
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Issue Reports</span>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => setReportModalVisible(true)}
                >
                  New Report
                </Button>
              </div>
            }
          >
            <ReportList gameId={id} showPuzzleInfo={true} refreshTimestamp={refreshTimestamp} />
          </Card>
        </TabPane>
      </Tabs>

      {/* Add Report Modal */}
      <Modal
        title={`Add Issue Report for ${game?.name}`}
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={700}
      >
        <ReportForm 
          gameId={id}
          onFinish={() => {
            setReportModalVisible(false);
            message.success('Report submitted successfully');
            setRefreshTimestamp(Date.now());
          }}
        />
      </Modal>
    </div>
  );
};

export default GameDetail; 