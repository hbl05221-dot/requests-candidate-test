import { useState } from 'react';
import type { RequestStatus, RequestType, SearchParams, SortField } from '../api/types';

const ALL_STATUSES: RequestStatus[]  = ['New', 'InProgress', 'Completed', 'Cancelled'];
const ALL_TYPES:    RequestType[]     = ['General', 'Legal', 'Payment', 'Appeal'];
const SORT_FIELDS:  SortField[]       = ['CreatedAt', 'RequestNumber', 'Status', 'RequestType'];

interface Props {
  initial:  SearchParams;
  onSearch: (params: SearchParams) => void;
  disabled: boolean;
}

export function SearchForm({ initial, onSearch, disabled }: Props) {
  const [form, setForm] = useState<SearchParams>(initial);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Reset to page 1 on a new search
    onSearch({ ...form, page: 1 });
  }

  function handleReset() {
    const fresh = { ...initial };
    setForm(fresh);
    onSearch({ ...fresh, page: 1 });
  }

  function toggleStatus(s: RequestStatus) {
    setForm(prev => ({
      ...prev,
      statuses: prev.statuses.includes(s)
        ? prev.statuses.filter(x => x !== s)
        : [...prev.statuses, s],
    }));
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form} aria-label="Search requests">
      {/* Request Number */}
      <div style={styles.field}>
        <label htmlFor="requestNumber" style={styles.label}>Request Number</label>
        <input
          id="requestNumber"
          type="text"
          placeholder="e.g. REQ-000"
          value={form.requestNumber}
          onChange={e => setForm(p => ({ ...p, requestNumber: e.target.value }))}
          style={styles.input}
          disabled={disabled}
        />
      </div>

      {/* Status (multi-select via checkboxes) */}
      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Status</legend>
        <div style={styles.checkGroup}>
          {ALL_STATUSES.map(s => (
            <label key={s} style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={form.statuses.includes(s)}
                onChange={() => toggleStatus(s)}
                disabled={disabled}
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Date range */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label htmlFor="dateFrom" style={styles.label}>From</label>
          <input
            id="dateFrom"
            type="date"
            value={form.dateFrom}
            onChange={e => setForm(p => ({ ...p, dateFrom: e.target.value }))}
            style={styles.input}
            disabled={disabled}
          />
        </div>
        <div style={styles.field}>
          <label htmlFor="dateTo" style={styles.label}>To</label>
          <input
            id="dateTo"
            type="date"
            value={form.dateTo}
            min={form.dateFrom || undefined}
            onChange={e => setForm(p => ({ ...p, dateTo: e.target.value }))}
            style={styles.input}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Request Type */}
      <div style={styles.field}>
        <label htmlFor="requestType" style={styles.label}>Request Type</label>
        <select
          id="requestType"
          value={form.requestType}
          onChange={e => setForm(p => ({ ...p, requestType: e.target.value as RequestType | '' }))}
          style={styles.input}
          disabled={disabled}
        >
          <option value="">All types</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Sorting */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label htmlFor="sortBy" style={styles.label}>Sort by</label>
          <select
            id="sortBy"
            value={form.sortBy}
            onChange={e => setForm(p => ({ ...p, sortBy: e.target.value as SortField }))}
            style={styles.input}
            disabled={disabled}
          >
            {SORT_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label htmlFor="sortDir" style={styles.label}>Direction</label>
          <select
            id="sortDir"
            value={form.sortDescending ? 'desc' : 'asc'}
            onChange={e => setForm(p => ({ ...p, sortDescending: e.target.value === 'desc' }))}
            style={styles.input}
            disabled={disabled}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button type="submit" style={styles.btnPrimary} disabled={disabled}>
          {disabled ? 'Searching…' : 'Search'}
        </button>
        <button type="button" style={styles.btnSecondary} onClick={handleReset} disabled={disabled}>
          Reset
        </button>
      </div>
    </form>
  );
}

// ── Inline styles (no CSS-in-JS dependency needed for this exercise) ──────────
const styles: Record<string, React.CSSProperties> = {
  form:        { display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #dee2e6' },
  field:       { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  row:         { display: 'flex', gap: 12 },
  label:       { fontSize: 13, fontWeight: 600, color: '#495057' },
  input:       { padding: '6px 10px', borderRadius: 4, border: '1px solid #ced4da', fontSize: 14 },
  fieldset:    { border: '1px solid #ced4da', borderRadius: 4, padding: '8px 12px' },
  legend:      { fontSize: 13, fontWeight: 600, color: '#495057', padding: '0 4px' },
  checkGroup:  { display: 'flex', flexWrap: 'wrap', gap: 12 },
  checkLabel:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' },
  actions:     { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  btnPrimary:  { padding: '8px 20px', borderRadius: 4, border: 'none', background: '#0d6efd', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  btnSecondary:{ padding: '8px 20px', borderRadius: 4, border: '1px solid #6c757d', background: '#fff', color: '#6c757d', fontSize: 14, cursor: 'pointer' },
};
