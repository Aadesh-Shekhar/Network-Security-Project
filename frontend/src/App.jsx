import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  Globe, 
  Terminal, 
  Zap,
  Server,
  Database,
  Bell
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const API_BASE = "http://localhost:8000/api";

const App = () => {
  const [stats, setStats] = useState({ total_packets: 0, active_devices: 0, uptime_seconds: 0, alerts_count: 0 });
  const [devices, setDevices] = useState([]);
  const [ports, setPorts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, devicesRes, portsRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/devices`),
        axios.get(`${API_BASE}/ports`),
        axios.get(`${API_BASE}/alerts`)
      ]);
      setStats(statsRes.data);
      setDevices(devicesRes.data);
      setPorts(portsRes.data);
      
      // Real-time Alert Notification Logic
      if (alertsRes.data.length > alerts.length && alerts.length > 0) {
        const newAlerts = alertsRes.data.slice(0, alertsRes.data.length - alerts.length);
        newAlerts.forEach(alert => {
          toast.error(`SECURITY ALERT: ${alert.type}\nFrom: ${alert.src_ip}`, {
            duration: 5000,
            position: 'top-right',
            icon: <ShieldAlert color="#e11d48" />,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '2px solid #e11d48',
              fontWeight: '600'
            }
          });
        });
      }
      
      setAlerts(alertsRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#0ea5e9', '#38bdf8'];

  return (
    <div className="dashboard">
      <Toaster />
      <header style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="IDS Logo" style={{ width: '60px', height: '60px' }} />
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
              IDS
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Intrusion Detection System</p>
          </div>
        </div>
        <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="stat-value" style={{ fontSize: '1rem', margin: 0 }}>{formatUptime(stats.uptime_seconds)}</div>
          <div className="badge" style={{ background: 'rgba(30, 58, 138, 0.1)', color: 'var(--accent-primary)' }}>SYSTEM ONLINE</div>
        </div>
      </header>

      <div className="stats-container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div className="stat-label">Total Traffic</div>
            <Activity size={20} color="#1e3a8a" />
          </div>
          <div className="stat-value">{stats.total_packets.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>Analyzing packets...</div>
        </div>
        
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div className="stat-label">Active Devices</div>
            <Globe size={20} color="#0ea5e9" />
          </div>
          <div className="stat-value">{stats.active_devices}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Connected IPs</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div className="stat-label">Engine Status</div>
            <Cpu size={20} color="#1e3a8a" />
          </div>
          <div className="stat-value">Core-v1</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>Optimal Performance</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div className="stat-label">Alerts Found</div>
            <ShieldAlert size={20} color="#e11d48" />
          </div>
          <div className="stat-value" style={{ color: stats.alerts_count > 0 ? 'var(--danger)' : 'inherit' }}>{stats.alerts_count}</div>
          <div style={{ fontSize: '0.75rem', color: stats.alerts_count > 0 ? 'var(--danger)' : 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {stats.alerts_count > 0 ? 'Security Incident' : 'No threats detected'}
          </div>
        </div>
      </div>

      <div className="card main-chart">
        <h3><Zap size={18} style={{ marginRight: '0.5rem' }} /> Port Distribution Analysis</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ports}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="port" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ports.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card alerts-panel">
        <h3><ShieldAlert size={18} style={{ marginRight: '0.5rem' }} /> Security Alerts</h3>
        <div className="alerts-list">
          {alerts.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No alerts yet...</div>
          ) : (
            alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item ${alert.type === 'PORT SCAN' ? '' : 'warning'}`}>
                <div style={{ fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{alert.type}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{alert.timestamp.split(' ')[1]}</span>
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Source: {alert.src_ip}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{alert.detail}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card devices-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3><Server size={18} style={{ marginRight: '0.5rem' }} /> Detected Devices</h3>
          <span className="badge badge-blue">{devices.length} Devices Total</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>IP ADDRESS</th>
              <th>FIRST SEEN</th>
              <th>LAST ACTIVITY</th>
              <th>PACKET COUNT</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{device.ip}</td>
                <td>{device.first_seen}</td>
                <td>{device.last_seen}</td>
                <td>{device.packet_count.toLocaleString()}</td>
                <td>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
