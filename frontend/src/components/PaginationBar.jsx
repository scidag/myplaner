export default function PaginationBar({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 2);
      let end = Math.min(totalPages - 1, page + 2);
      if (page <= 3) { start = 2; end = Math.min(5, totalPages - 1); }
      if (page >= totalPages - 2) { start = Math.max(totalPages - 4, 2); end = totalPages - 1; }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        共 <strong>{total}</strong> 条任务
      </div>
      <div className="pagination-nav">
        <button className="page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>◀</button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="page-ellipsis">...</span>
          ) : (
            <button key={p} className={`page-btn${p === page ? ' current' : ''}`} onClick={() => onPageChange(p)}>
              {p}
            </button>
          )
        )}
        <button className="page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>▶</button>
      </div>
      <div className="page-size-selector">
        每页
        <select className="page-size-select" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        条
      </div>
    </div>
  );
}
