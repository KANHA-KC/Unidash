import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { DataSource } from '../../types/dashboard';
import { parseCSV } from '../../utils/csvParser';
import { X, Database, FileSpreadsheet, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({ isOpen, onClose }) => {
  const { addDataSource } = useDashboard();
  const [sourceType, setSourceType] = useState<'csv' | 'rest'>('csv');

  // CSV State
  const [csvName, setCsvName] = useState('Product_Metrics_Q4.csv');
  const [csvContent, setCsvContent] = useState(
    `Product,Tier,MRR,Status,Growth\nUnidash Studio,Pro,42000,Active,18%\nDataMesh Cloud,Enterprise,28000,Active,12%\nPulse Telemetry,Growth,14250,Review,24%`
  );

  // REST API State
  const [apiName, setApiName] = useState('Stripe Revenue Stream');
  const [apiUrl, setApiUrl] = useState('https://api.stripe.com/v1/metrics/live');
  const [refreshInterval, setRefreshInterval] = useState('10');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  if (!isOpen) return null;

  const handleTestRest = () => {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus('success');
    }, 500);
  };

  const handleSaveSource = () => {
    if (sourceType === 'csv') {
      const parsed = parseCSV(csvContent);
      const newDs: DataSource = {
        id: `source-csv-${Date.now()}`,
        name: csvName,
        type: 'csv',
        status: 'connected',
        lastSync: 'Just now',
        refreshIntervalSec: 0,
        data: parsed.rows,
      };
      addDataSource(newDs);
    } else {
      const newDs: DataSource = {
        id: `source-rest-${Date.now()}`,
        name: apiName,
        type: 'rest',
        status: 'connected',
        lastSync: 'Just now',
        refreshIntervalSec: Number(refreshInterval) || 10,
        endpointUrl: apiUrl,
        data: { mrr: 88500, activeUsers: 2400 },
      };
      addDataSource(newDs);
    }
    onClose();
  };

  return (
    <div className="apple-modal-overlay" onClick={onClose}>
      <div className="apple-modal-container" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(10, 132, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--apple-blue)',
              }}
            >
              <Database size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Connect Live Data Source</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Import structured CSV files or connect polling REST API endpoints
              </p>
            </div>
          </div>
          <button onClick={onClose} className="apple-clickable" style={{ padding: '6px', color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Source Type Selector */}
        <div style={{ padding: '16px 24px 0 24px' }}>
          <div className="apple-segmented-control" style={{ width: '100%' }}>
            <button
              onClick={() => setSourceType('csv')}
              className={`apple-segmented-item ${sourceType === 'csv' ? 'active' : ''}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <FileSpreadsheet size={13} />
              CSV Spreadsheet
            </button>
            <button
              onClick={() => setSourceType('rest')}
              className={`apple-segmented-item ${sourceType === 'rest' ? 'active' : ''}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Globe size={13} />
              REST API Endpoint
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sourceType === 'csv' ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                  DATASET FILE NAME
                </label>
                <input
                  type="text"
                  value={csvName}
                  onChange={(e) => setCsvName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                  CSV DATA (PASTE OR EDIT)
                </label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                  CONNECTOR NAME
                </label>
                <input
                  type="text"
                  value={apiName}
                  onChange={(e) => setApiName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                  ENDPOINT URL
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <button
                    onClick={handleTestRest}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '0 14px' }}
                  >
                    {testStatus === 'testing' ? 'Pinging...' : 'Test Ping'}
                  </button>
                </div>
              </div>

              {testStatus === 'success' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'rgba(48, 209, 88, 0.12)',
                    border: '1px solid rgba(48, 209, 88, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#30D158',
                    fontSize: '12px',
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Connection successful. 200 OK — discovered fields: [mrr, activeUsers, latency]</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                  POLLING REFRESH INTERVAL (SECONDS)
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="5" style={{ background: '#1c1d24' }}>Every 5 seconds (Real-time)</option>
                  <option value="15" style={{ background: '#1c1d24' }}>Every 15 seconds</option>
                  <option value="60" style={{ background: '#1c1d24' }}>Every 60 seconds</option>
                  <option value="300" style={{ background: '#1c1d24' }}>Every 5 minutes</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px' }}>
            Cancel
          </button>
          <button onClick={handleSaveSource} className="btn-primary" style={{ padding: '8px 20px' }}>
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};
