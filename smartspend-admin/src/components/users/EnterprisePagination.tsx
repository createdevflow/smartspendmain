import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Props {
  meta: any;
  setFilters: (f: any) => void;
}

export function EnterprisePagination({ meta, setFilters }: Props) {
  if (!meta || meta.total === 0) return null;

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= meta.totalPages) {
      setFilters((prev: any) => ({ ...prev, page }));
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev: any) => ({ ...prev, limit: Number(e.target.value), page: 1 }));
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', gap: '1rem' }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Showing <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{start}</span> to <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{end}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{meta.total}</span> Users
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rows per page:</span>
          <select 
            value={meta.limit} 
            onChange={handleLimitChange}
            className="input-field"
            style={{ marginBottom: 0, padding: '0.25rem 0.5rem', height: 'auto', minHeight: 'auto', width: 'auto' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={meta.page === 1}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ChevronsLeft size={16} />
          </button>
          <button 
            onClick={() => handlePageChange(meta.page - 1)} 
            disabled={meta.page === 1}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ChevronLeft size={16} />
          </button>
          
          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, padding: '0 0.5rem' }}>
            Page {meta.page} of {meta.totalPages}
          </span>

          <button 
            onClick={() => handlePageChange(meta.page + 1)} 
            disabled={meta.page === meta.totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ChevronRight size={16} />
          </button>
          <button 
            onClick={() => handlePageChange(meta.totalPages)} 
            disabled={meta.page === meta.totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
