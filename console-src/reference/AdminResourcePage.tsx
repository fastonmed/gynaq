import {referenceFetch} from '../api';
'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Download,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Package,
  RefreshCw,
  CheckCircle2,
  X,
  Layers,
  Edit3
} from 'lucide-react';

export type AdminResourceItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'Live' | 'Active' | 'Draft' | 'Pending' | 'Scheduled' | 'Ready';
  updated: string;
  image?: string;
  price?: number;
  slug?: string;
};

type Props = {
  title: string;
  eyebrow: string;
  description: string;
  actionLabel: string;
  items: AdminResourceItem[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
};

function decodeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

export default function AdminResourcePage({
  title,
  eyebrow,
  description,
  actionLabel,
  items: initialItems, onAdd, onEdit
}: Props) {
  const isProductsView = title.toLowerCase().includes('product') || title.toLowerCase().includes('inventory');
  const isCategoriesView = title.toLowerCase().includes('categor');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(isProductsView ? 'Live' : 'All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [items, setItems] = useState<AdminResourceItem[]>(initialItems);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Sync WooCommerce catalog
  const handleSyncWooCommerce = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await referenceFetch('/api/admin/migration', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`Synced ${data.importedCount} products!`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setSyncResult(data.message || 'Sync failed');
      }
    } catch {
      setSyncResult('Sync error');
    } finally {
      setSyncing(false);
    }
  };

  // Status counts
  const liveCount = useMemo(
    () => items.filter((item) => item.status === 'Live' || item.status === 'Active' || item.status === 'Ready').length,
    [items]
  );
  const draftCount = useMemo(
    () => items.filter((item) => item.status === 'Draft' || item.status === 'Pending').length,
    [items]
  );

  // Unique categories/types for dropdown
  const uniqueTypes = useMemo(() => {
    if (isCategoriesView) return [];
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.type && item.type !== 'Category' && item.type !== 'Department') {
        set.add(decodeHtml(item.type));
      }
    });
    return Array.from(set).sort();
  }, [items, isCategoriesView]);

  // Filtered rows
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const cleanTitle = decodeHtml(item.title);
      const cleanDesc = decodeHtml(item.description);
      const cleanType = decodeHtml(item.type);
      const matchesQuery =
        !query ||
        `${cleanTitle} ${cleanDesc} ${cleanType}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Live' && (item.status === 'Live' || item.status === 'Active' || item.status === 'Ready')) ||
        (statusFilter === 'Draft' && (item.status === 'Draft' || item.status === 'Pending'));
      const matchesType = typeFilter === 'All' || cleanType === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [items, query, statusFilter, typeFilter]);

  const hasPrices = useMemo(
    () => isProductsView && items.some((item) => typeof item.price === 'number'),
    [isProductsView, items]
  );

  const addDraft = () => {
    if (onAdd) { onAdd(); return; }
    setItems((current) => [
      {
        id: `new-${Date.now()}`,
        title: `Untitled ${actionLabel.replace(/^Add /, '')}`,
        description: isCategoriesView ? '0 products' : 'SKU: pending',
        type: isCategoriesView ? 'Department' : 'General Equipment',
        status: isCategoriesView ? 'Active' : 'Draft',
        updated: 'Just now',
        price: 0
      },
      ...current
    ]);
  };

  const toggleStatus = (id: string) => {
    setItems((current) =>
      current.map((row) =>
        row.id === id ? { ...row, status: row.status === 'Draft' ? 'Live' : 'Draft' } : row
      )
    );
  };

  const exportCsv = () => {
    const csv = [
      'Title,Type,Status,Price,Updated',
      ...filteredItems.map((item) =>
        [decodeHtml(item.title), decodeHtml(item.type), item.status, item.price ?? '', item.updated]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(',')
      )
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${eyebrow.toLowerCase().replaceAll(' ', '-')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px 32px 64px', backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Unified Minimal Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#51b291', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {eyebrow}
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              {items.length.toLocaleString()} total {isCategoriesView ? 'departments' : 'entries'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            {description}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {syncResult && (
            <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={15} /> {syncResult}
            </span>
          )}

          {isProductsView && (
            <button
              onClick={handleSyncWooCommerce}
              disabled={syncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#334155',
                cursor: syncing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Syncing…' : 'Sync Catalog'}</span>
            </button>
          )}

          <button
            onClick={addDraft}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#51b291',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#429a7c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#51b291')}
          >
            <Plus size={16} />
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>

      {/* Modern Status Tabs Filter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '18px',
          paddingBottom: '2px'
        }}
      >
        <button
          onClick={() => setStatusFilter('All')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            border: 'none',
            background: 'none',
            fontSize: '0.88rem',
            fontWeight: statusFilter === 'All' ? 700 : 500,
            color: statusFilter === 'All' ? '#51b291' : '#64748b',
            borderBottom: statusFilter === 'All' ? '2px solid #51b291' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer'
          }}
        >
          <span>All</span>
          <span style={{ fontSize: '0.74rem', backgroundColor: statusFilter === 'All' ? '#eaf7f2' : '#f1f5f9', color: statusFilter === 'All' ? '#2f6b57' : '#64748b', padding: '1px 7px', borderRadius: '10px' }}>
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('Live')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            border: 'none',
            background: 'none',
            fontSize: '0.88rem',
            fontWeight: statusFilter === 'Live' ? 700 : 500,
            color: statusFilter === 'Live' ? '#51b291' : '#64748b',
            borderBottom: statusFilter === 'Live' ? '2px solid #51b291' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer'
          }}
        >
          <span>{isCategoriesView ? 'Active Departments' : 'Live / Published'}</span>
          <span style={{ fontSize: '0.74rem', backgroundColor: statusFilter === 'Live' ? '#eaf7f2' : '#f1f5f9', color: statusFilter === 'Live' ? '#2f6b57' : '#64748b', padding: '1px 7px', borderRadius: '10px' }}>
            {liveCount}
          </span>
        </button>

        {draftCount > 0 && (
          <button
            onClick={() => setStatusFilter('Draft')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              background: 'none',
              fontSize: '0.88rem',
              fontWeight: statusFilter === 'Draft' ? 700 : 500,
              color: statusFilter === 'Draft' ? '#51b291' : '#64748b',
              borderBottom: statusFilter === 'Draft' ? '2px solid #51b291' : '2px solid transparent',
              marginBottom: '-1px',
              cursor: 'pointer'
            }}
          >
            <span>Drafts</span>
            <span style={{ fontSize: '0.74rem', backgroundColor: statusFilter === 'Draft' ? '#eaf7f2' : '#f1f5f9', color: statusFilter === 'Draft' ? '#2f6b57' : '#64748b', padding: '1px 7px', borderRadius: '10px' }}>
              {draftCount}
            </span>
          </button>
        )}
      </div>

      {/* Main Content Card: Search Bar & Tailored Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden'
        }}
      >
        {/* Search & Filter Toolbar */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          {/* Search Input */}
          <div
            style={{
              flex: 1,
              minWidth: '240px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.88rem',
                color: '#0f172a',
                backgroundColor: 'transparent'
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type / Category Filter Dropdown (only for products) */}
          {uniqueTypes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersHorizontal size={14} color="#64748b" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="All">All Categories</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={exportCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Tailored Table */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr
                style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}
              >
                <th style={{ padding: '12px 20px', minWidth: '280px', backgroundColor: '#f8fafc' }}>
                  {isCategoriesView ? 'Specialty / Department' : isProductsView ? 'Product' : 'Title'}
                </th>
                {!isCategoriesView && (
                  <th style={{ padding: '12px 16px', minWidth: '150px', backgroundColor: '#f8fafc' }}>Category / Type</th>
                )}
                {hasPrices && <th style={{ padding: '12px 16px', minWidth: '100px', backgroundColor: '#f8fafc' }}>Price</th>}
                <th style={{ padding: '12px 16px', minWidth: '100px', backgroundColor: '#f8fafc' }}>Status</th>
                {!isCategoriesView && (
                  <th style={{ padding: '12px 16px', minWidth: '110px', backgroundColor: '#f8fafc' }}>Last Updated</th>
                )}
                <th style={{ padding: '12px 20px', minWidth: '90px', textAlign: 'right', backgroundColor: '#f8fafc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const cleanTitle = decodeHtml(item.title);
                const cleanDesc = decodeHtml(item.description);
                const cleanType = decodeHtml(item.type);

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafcfb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    {/* Item Image & Title */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Thumbnail Container */}
                        <div
                          style={{
                            position: 'relative',
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={cleanTitle}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div style="width:100%;height:100%;background:#eaf7f2;display:flex;align-items:center;justify-content:center;color:#51b291"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>';
                                }
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#eaf7f2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#51b291'
                              }}
                            >
                              {isCategoriesView ? <Layers size={20} /> : <Package size={20} />}
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          {item.slug ? (
                            <Link
                              href={
                                title.toLowerCase().includes('page')
                                  ? `/admin/content/pages/${item.slug.replace(/^\//, '')}`
                                  : item.slug.startsWith('/')
                                  ? item.slug
                                  : `/product/${item.slug}`
                              }
                              target={title.toLowerCase().includes('page') ? undefined : '_blank'}
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: '#0f172a',
                                textDecoration: 'none',
                                display: 'inline-block',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                transition: 'color 0.15s'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#51b291')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                            >
                              {cleanTitle}
                            </Link>
                          ) : (
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: '#0f172a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {cleanTitle}
                            </div>
                          )}
                          <div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '2px', fontWeight: 500 }}>
                            {cleanDesc}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Pill (Non-categories view) */}
                    {!isCategoriesView && (
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cleanType}
                        </span>
                      </td>
                    )}

                    {/* Price (Products only) */}
                    {hasPrices && (
                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        {typeof item.price === 'number' && item.price > 0 ? (
                          <span>AED {item.price.toLocaleString()}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 500 }}>Enquiry</span>
                        )}
                      </td>
                    )}

                    {/* Status Pill */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        type="button"
                        onClick={() => onEdit ? onEdit(item.id) : toggleStatus(item.id)}
                        title="Click to toggle status"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: item.status === 'Live' || item.status === 'Active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: item.status === 'Live' || item.status === 'Active' ? '#f0fdf4' : '#f8fafc',
                          color: item.status === 'Live' || item.status === 'Active' ? '#16a34a' : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: item.status === 'Live' || item.status === 'Active' ? '#16a34a' : '#94a3b8'
                          }}
                        />
                        <span>{item.status}</span>
                      </button>
                    </td>

                    {/* Last Updated (Non-categories view) */}
                    {!isCategoriesView && (
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                        {item.updated}
                      </td>
                    )}

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {onEdit && <button type="button" onClick={() => onEdit(item.id)} style={{border: '1px solid #d8e2df', background:'white',borderRadius:6,padding:'6px 10px',color:'#277f61',cursor:'pointer'}}>Edit</button>}
                        {item.slug && title.toLowerCase().includes('page') && (
                          <Link
                            href={`/admin/content/pages/${item.slug.replace(/^\//, '')}`}
                            style={{
                              padding: '5px 11px',
                              backgroundColor: '#eaf7f2',
                              color: '#2f6b57',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d3f1e5')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#eaf7f2')}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </Link>
                        )}

                        {item.slug && (
                          <Link
                            href={item.slug.startsWith('/') ? item.slug : `/product/${item.slug}`}
                            target="_blank"
                            title={isCategoriesView ? 'View category in storefront' : 'View product on storefront'}
                            style={{
                              padding: '6px',
                              color: '#64748b',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              transition: 'color 0.15s, background-color 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#51b291';
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#64748b';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <ExternalLink size={16} />
                          </Link>
                        )}

                        <button
                          type="button"
                          aria-label={`Actions for ${cleanTitle}`}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
              <Package size={32} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '4px' }}>
                No records match your search
              </div>
              <p style={{ fontSize: '0.84rem', margin: 0 }}>
                Try changing your search term or status filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
