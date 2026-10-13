import React, { useEffect, useState } from 'react';
import JobTable from '../components/JobTable';
import { Search, Filter, ListTodo, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const statusOptions = [
    'All',
    'Scheduled',
    'Running',
    'Completed',
    'Pending',
    'Failed'
  ];

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/jobs`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setJobs(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(
        'Unable to load jobs. Make sure the Flask backend is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const name = String(job.name || '');
    const jobId = String(job.job_id || job.id || '');
    const type = String(job.type || '');

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All' || job.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">

      <div className="page-header-block">
        <div>
          <h1 className="page-title">Submitted Workload Jobs</h1>
          <p className="page-description">
            Monitor and review all active, scheduled, completed, and pending
            serverless workloads.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={fetchJobs}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body">
            <p style={{ color: '#dc2626', margin: 0 }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card jobs-filter-card">
        <div className="jobs-filter-grid">

          <div className="search-box">
            <Search size={18} className="search-icon" />

            <input
              type="text"
              placeholder="Search by Job ID, name, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="status-tabs">
            <Filter size={16} className="filter-label-icon" />

            {statusOptions.map((st) => (
              <button
                key={st}
                className={`tab-btn ${
                  selectedStatus === st ? 'active' : ''
                }`}
                onClick={() => setSelectedStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Jobs Table */}
      <div className="card">

        <div className="card-header">
          <div className="card-title-group">
            <ListTodo size={20} className="text-green-accent" />

            <h2 className="card-title">
              All Jobs ({filteredJobs.length})
            </h2>
          </div>
        </div>

        <div className="card-body">

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              Loading jobs from backend...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              No jobs found.
            </div>
          ) : (
            <JobTable
              jobs={filteredJobs}
              showDetailsButton={true}
            />
          )}

        </div>
      </div>

    </div>
  );
}
