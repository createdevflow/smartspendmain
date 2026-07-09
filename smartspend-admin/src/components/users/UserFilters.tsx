import { Search, RotateCcw } from 'lucide-react';

interface UserFiltersProps {
  filters: any;
  setFilters: (f: any) => void;
  onClear: () => void;
}

export function UserFilters({ filters, setFilters, onClear }: UserFiltersProps) {
  const handleChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search by name, email, phone, or ID..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.25rem', marginBottom: 0 }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: '1 1 auto' }}>
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="input-field"
            style={{ marginBottom: 0, width: 'auto' }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Unverified</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="input-field"
            style={{ marginBottom: 0, width: 'auto' }}
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => handleChange('dateRange', e.target.value)}
            className="input-field"
            style={{ marginBottom: 0, width: 'auto' }}
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
          {/* Activity Filter */}
          <select
            value={filters.activity}
            onChange={(e) => handleChange('activity', e.target.value)}
            className="input-field"
            style={{ marginBottom: 0, width: 'auto' }}
          >
            <option value="">Any Activity</option>
            <option value="online">Online Now</option>
            <option value="offline">Offline</option>
          </select>

          <button
            onClick={onClear}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}
