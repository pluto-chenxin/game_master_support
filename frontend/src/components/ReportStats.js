import React, { useState, useEffect } from 'react';
import { 
  Card, Statistic, Row, Col, Select, Divider, 
  Table, Badge, Progress, Empty, Spin, Alert,
  DatePicker
} from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  FilterOutlined,
  SyncOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import config from '../config';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportStats = ({ gameId, workspaceId }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [timeRange, customDateRange, gameId, workspaceId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Construct URL with query parameters
      let url = `${config.API_URL}/api/reports/stats`;
      const params = new URLSearchParams();
      
      if (timeRange !== 'custom') {
        params.append('range', timeRange);
      } else if (customDateRange && customDateRange.length === 2) {
        params.append('startDate', customDateRange[0].toISOString());
        params.append('endDate', customDateRange[1].toISOString());
      }
      
      if (gameId) {
        params.append('gameId', gameId);
      }
      
      if (workspaceId) {
        params.append('workspaceId', workspaceId);
      }
      
      url = `${url}?${params.toString()}`;
      
      const response = await axios.get(url);
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report statistics:', err);
      setError('Failed to load statistics. Please try again.');
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    if (value !== 'custom') {
      setCustomDateRange(null);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setCustomDateRange(dates);
    } else {
      setCustomDateRange(null);
    }
  };

  // Calculate totals across all games
  const calculateTotals = () => {
    if (!stats || stats.length === 0) return { total: 0, open: 0, inProgress: 0, resolved: 0 };
    
    return stats.reduce((acc, game) => {
      acc.total += game.total;
      acc.open += game.open;
      acc.inProgress += game.inProgress || 0;
      acc.resolved += game.resolved;
      return acc;
    }, { total: 0, open: 0, inProgress: 0, resolved: 0 });
  };

  const totals = calculateTotals();

  // Columns for the statistics table
  const columns = [
    {
      title: 'Game',
      dataIndex: 'gameName',
      key: 'gameName',
    },
    {
      title: 'Total Issues',
      dataIndex: 'total',
      key: 'total',
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: 'Open Issues',
      dataIndex: 'open',
      key: 'open',
      render: (open, record) => (
        <Badge count={open} showZero style={{ backgroundColor: open > 0 ? '#faad14' : '#8c8c8c' }} />
      ),
      sorter: (a, b) => a.open - b.open,
    },
    {
      title: 'In Progress',
      dataIndex: 'inProgress',
      key: 'inProgress',
      render: (inProgress, record) => (
        <Badge count={inProgress || 0} showZero style={{ backgroundColor: inProgress > 0 ? '#1890ff' : '#8c8c8c' }} />
      ),
      sorter: (a, b) => (a.inProgress || 0) - (b.inProgress || 0),
    },
    {
      title: 'Resolved Issues',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (resolved, record) => (
        <Badge count={resolved} showZero style={{ backgroundColor: '#52c41a' }} />
      ),
      sorter: (a, b) => a.resolved - b.resolved,
    },
    {
      title: 'Resolution Rate',
      key: 'resolutionRate',
      render: (_, record) => (
        record.total > 0 ? (
          <Progress 
            percent={Math.round((record.resolved / record.total) * 100)} 
            size="small" 
            status={record.resolved === record.total ? "success" : "active"}
          />
        ) : (
          <Progress percent={0} size="small" status="exception" />
        )
      ),
      sorter: (a, b) => (a.resolved / a.total) - (b.resolved / b.total),
    },
  ];

  if (loading) {
    return <Spin tip="Loading statistics..." />;
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
    <div className="report-stats-container">
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Report Statistics</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterOutlined />
            <Select 
              value={timeRange} 
              onChange={handleTimeRangeChange}
              style={{ width: 150 }}
            >
              <Option value="week">Last Week</Option>
              <Option value="month">Last Month</Option>
              <Option value="year">Last Year</Option>
              <Option value="custom">Custom Range</Option>
            </Select>
            
            {timeRange === 'custom' && (
              <RangePicker 
                onChange={handleDateRangeChange}
                style={{ marginLeft: 8 }}
              />
            )}
          </div>
        </div>
        
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Issues"
                value={totals.total}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Open Issues"
                value={totals.open}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={totals.inProgress || 0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SyncOutlined spin />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Resolved Issues"
                value={totals.resolved}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {stats.length === 0 ? (
          <Empty description="No report data available for the selected time period" />
        ) : (
          <Table 
            columns={columns} 
            dataSource={stats} 
            rowKey="gameId"
            expandable={{
              expandedRowRender: record => (
                record.puzzles && record.puzzles.length > 0 ? (
                  <Table
                    columns={[
                      { title: 'Puzzle', dataIndex: 'title', key: 'title' },
                      { title: 'Total', dataIndex: 'total', key: 'total' },
                      { title: 'Open', dataIndex: 'open', key: 'open' },
                      { title: 'In Progress', dataIndex: 'inProgress', key: 'inProgress', 
                        render: val => val || 0 },
                      { title: 'Resolved', dataIndex: 'resolved', key: 'resolved' },
                    ]}
                    dataSource={record.puzzles}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Empty description="No puzzle-specific issues reported" />
                )
              ),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default ReportStats; 