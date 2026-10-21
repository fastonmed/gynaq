import {referenceFetch} from '../api';
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  ArrowLeft,
  ExternalLink,
  Save,
  CheckCircle2,
  Trash2,
  Edit3,
  Layers,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  Eye,
  SlidersHorizontal,
  Check,
  Globe,
  Sparkles,
  Smartphone,
  Monitor,
  MoveUp,
  MoveDown,
  FolderTree,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export type PageSection = {
  title: string;
  paragraphs: string[];
  points?: string[];
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type AdminPageItem = {
  id: string;
  slug: string;
  title: string;
  eyebrow?: string;
  description?: string;
  heroImage?: string;
  pageGroup?: 'core' | 'seo' | 'other';
  status: 'published' | 'draft';
  sections: PageSection[];
  faqs?: FAQItem[];
  seoTitle?: string;
  seoDescription?: string;
  updatedAt?: string;
};

// Default fallback core pages to ensure all pages are available for editing
const DEFAULT_CORE_PAGES: AdminPageItem[] = [
  {
    id: 'core-home',
    slug: '',
    title: 'Home — Leading Medical Equipment Supplier in UAE',
    eyebrow: 'GYNAEQ UAE',
    description: 'Premier supplier of hospital, dental, ICU, and clinical medical equipment across Dubai and the United Arab Emirates.',
    pageGroup: 'core',
    status: 'published',
    sections: [
      {
        title: 'Reliable Medical Equipment Solutions in UAE',
        paragraphs: [
          'GYNAEQ is a trusted distributor and biomedical engineering service provider in Dubai, serving hospitals, clinics, diagnostic centers, and healthcare professionals across the UAE.',
          'We supply MOH-compliant medical equipment, surgical instruments, diagnostic monitors, dental units, and preventive maintenance agreements.'
        ],
        points: ['Certified Medical Equipment', 'Prompt Delivery Across UAE', '24/7 Biomedical Support', 'Official Manufacturer Warranty']
      }
    ],
    faqs: [
      { question: 'Do you deliver medical equipment across all Emirates?', answer: 'Yes, we provide swift delivery and clinical installation across Dubai, Abu Dhabi, Sharjah, Ajman, and all UAE regions.' }
    ],
    seoTitle: 'GYNAEQ | Medical Equipment Supplier in Dubai & UAE',
    seoDescription: 'Leading medical equipment supplier in Dubai, UAE. Certified hospital supplies, ICU devices, dental chairs, patient monitors and biomedical engineering services.'
  },
  {
    id: 'core-shop',
    slug: 'shop',
    title: 'Shop — Medical Equipment & Hospital Supplies Store',
    eyebrow: 'Online Catalogue',
    description: 'Browse certified healthcare products, diagnostic tools, patient care equipment, and medical disposables.',
    pageGroup: 'core',
    status: 'published',
    sections: [
      {
        title: 'Comprehensive Medical Catalogue',
        paragraphs: [
          'Explore our extensive catalogue of medical technology, cardiology systems, patient monitors, ICU equipment, and everyday clinical disposables.'
        ]
      }
    ],
    seoTitle: 'Medical Equipment Store Dubai | GYNAEQ Catalogue',
    seoDescription: 'Shop certified hospital supplies, diagnostic equipment, patient monitors, medical consumables, and clinical apparatus in UAE.'
  },
  {
    id: 'core-about',
    slug: 'about-us',
    title: 'About Us — GYNAEQ Dubai',
    eyebrow: 'About GYNAEQ',
    description: 'Empowering healthcare providers in Dubai and the UAE with cutting-edge medical devices and biomedical support services.',
    pageGroup: 'core',
    status: 'published',
    sections: [
      {
        title: 'Our Mission & Commitment',
        paragraphs: [
          'GYNAEQ (GYNAEQ TRADING L.L.C) was established with a singular focus: to elevate patient care by supplying reliable, certified medical technology alongside uncompromising maintenance and engineering services.',
          'Our team of certified biomedical engineers and clinical consultants works closely with healthcare facilities to ensure operational excellence.'
        ],
        points: ['Certified Healthcare Supplier', 'Authorized Global Brand Partner', 'ISO Certified Quality Standards']
      }
    ],
    faqs: [
      { question: 'Where is GYNAEQ located in Dubai?', answer: 'Our main office and biomedical engineering center is situated in Dubai, UAE, with dedicated regional distribution channels.' }
    ],
    seoTitle: 'About GYNAEQ | Dubai Healthcare Partner',
    seoDescription: 'Learn about GYNAEQ (GYNAEQ TRADING L.L.C), Dubai\'s leading medical equipment supplier, biomedical engineering provider, and trusted healthcare partner.'
  },
  {
    id: 'core-contact',
    slug: 'contact',
    title: 'Contact Us — Sales & Biomedical Engineering UAE',
    eyebrow: 'Get in Touch',
    description: 'Connect with our clinical equipment advisors or schedule preventive maintenance for your medical facility.',
    pageGroup: 'core',
    status: 'published',
    sections: [
      {
        title: 'Reach Our Healthcare Specialists',
        paragraphs: [
          'Our biomedical engineers and medical equipment sales specialists are available to answer your technical questions, provide product quotations, or arrange on-site demonstrations.'
        ]
      }
    ],
    seoTitle: 'Contact GYNAEQ Dubai | Medical Equipment Quotations & Service',
    seoDescription: 'Contact GYNAEQ in Dubai, UAE for medical equipment enquiries, AMC/CMC contracts, product quotations, and technical support.'
  },
  {
    id: 'core-blog',
    slug: 'blog',
    title: 'Blog — Healthcare Technology & Clinical Insights',
    eyebrow: 'Healthcare Insights',
    description: 'Articles, equipment guides, regulatory updates, and maintenance best practices for healthcare professionals in UAE.',
    pageGroup: 'core',
    status: 'published',
    sections: [
      {
        title: 'Clinical Knowledge & Industry Trends',
        paragraphs: [
          'Stay informed with expert perspectives on medical technology, patient safety, sterilization standards, and biomedical equipment maintenance.'
        ]
      }
    ],
    seoTitle: 'Medical Technology Blog | GYNAEQ UAE Healthcare Insights',
    seoDescription: 'Read the latest healthcare technology insights, biomedical maintenance guides, and medical equipment reviews from GYNAEQ Dubai.'
  }
];

const DEFAULT_OTHER_PAGES: AdminPageItem[] = [
  {
    id: 'other-privacy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    eyebrow: 'GYNAEQ UAE',
    description: 'GYNAEQ (GYNAEQ TRADING L.L.C) privacy guidelines, data handling procedures, and client confidentiality policy.',
    pageGroup: 'other',
    status: 'published',
    sections: [
      {
        title: 'Privacy & Data Protection Policy',
        paragraphs: [
          'GYNAEQ (GYNAEQ TRADING L.L.C) is committed to safeguarding your privacy and protecting any personal or institutional data provided through our website or customer service interactions.',
          'We do not sell, rent, or distribute client contact information to unauthorized third parties. All transaction and enquiry details are kept strictly confidential.'
        ]
      }
    ],
    seoTitle: 'Privacy Policy | GYNAEQ UAE',
    seoDescription: 'GYNAEQ (GYNAEQ TRADING L.L.C) privacy policy, customer data protection, and confidentiality commitments in Dubai & UAE.'
  },
  {
    id: 'other-terms',
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    eyebrow: 'Store Policy',
    description: 'Terms of sale, equipment quotations, warranty conditions, and service terms for GYNAEQ storefront.',
    pageGroup: 'other',
    status: 'published',
    sections: [
      {
        title: 'Terms of Service & Equipment Quotations',
        paragraphs: [
          'All equipment orders, quotations, and service agreements are governed by the commercial regulations of the United Arab Emirates and GYNAEQ sales policies.',
          'Quotations are valid for 30 calendar days from issue date unless specified otherwise.'
        ]
      }
    ],
    seoTitle: 'Terms & Conditions | GYNAEQ Medical Equipment Dubai',
    seoDescription: 'Official terms and conditions for medical equipment purchases, service contracts, and delivery from GYNAEQ UAE.'
  },
  {
    id: 'other-shipping',
    slug: 'shipping',
    title: 'Shipping & Delivery Policy',
    eyebrow: 'Logistics UAE',
    description: 'Medical equipment delivery timelines, installation procedures, and delivery guidelines across the UAE.',
    pageGroup: 'other',
    status: 'published',
    sections: [
      {
        title: 'Delivery Timelines & Logistics',
        paragraphs: [
          'We offer prompt delivery across Dubai, Abu Dhabi, Sharjah, and northern Emirates for all catalogue products and clinical supplies in stock.',
          'Heavy clinical machinery such as hospital beds, dental chairs, and imaging units include scheduled delivery with professional installation by certified biomedical engineers.'
        ]
      }
    ],
    seoTitle: 'Shipping & Delivery Policy | GYNAEQ Dubai',
    seoDescription: 'GYNAEQ delivery policies, clinical equipment transit terms, and installation timelines across Dubai and the UAE.'
  },
  {
    id: 'other-returns',
    slug: 'returns-exchanges',
    title: 'Returns + Exchanges Policy',
    eyebrow: 'Customer Care',
    description: 'Procedures for returning or exchanging medical supplies, consumables, and hospital devices.',
    pageGroup: 'other',
    status: 'published',
    sections: [
      {
        title: 'Return and Replacement Terms',
        paragraphs: [
          'Unopened clinical supplies and non-custom medical consumables may be returned or exchanged within 7 days of delivery upon inspection.',
          'Medical equipment with active manufacturer warranties will be serviced, repaired, or replaced under warranty terms by our certified engineering team.'
        ]
      }
    ],
    seoTitle: 'Returns & Exchanges Policy | GYNAEQ UAE',
    seoDescription: 'Return, replacement, and warranty claim procedures for medical equipment and clinical supplies at GYNAEQ Dubai.'
  }
];

const emptyPage = (group: 'core' | 'seo' | 'other' = 'seo'): AdminPageItem => ({
  id: `page-${Date.now()}`,
  slug: '',
  title: '',
  eyebrow: 'GYNAEQ UAE',
  description: '',
  heroImage: '',
  pageGroup: group,
  status: 'published',
  sections: [
    {
      title: 'Overview',
      paragraphs: ['']
    }
  ],
  faqs: [],
  seoTitle: '',
  seoDescription: '',
  updatedAt: new Date().toISOString()
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function PageManager({
  mode: initialMode = 'list',
  pageSlug,
  isNew = false,
  initialType
}: {
  mode?: 'list' | 'editor';
  pageSlug?: string;
  isNew?: boolean;
  initialType?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlType = initialType || searchParams?.get('type') || 'all';

  const [mode, setMode] = useState<'list' | 'editor'>(initialMode);
  const [pages, setPages] = useState<AdminPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<string>(
    urlType === 'core' ? 'core' : urlType === 'seo' ? 'seo' : urlType === 'other' ? 'other' : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [query, setQuery] = useState('');

  // Editor states
  const [currentPage, setCurrentPage] = useState<AdminPageItem>(emptyPage());
  const [originalPageJson, setOriginalPageJson] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // SEO Modal
  const [seoModalOpen, setSeoModalOpen] = useState(false);
  const [seoPreviewTab, setSeoPreviewTab] = useState<'desktop' | 'mobile'>('desktop');

  // Quick edit state
  const [quickEditSlug, setQuickEditSlug] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSlugValue, setQuickSlugValue] = useState('');
  const [quickGroup, setQuickGroup] = useState<'core' | 'seo' | 'other'>('seo');
  const [quickStatus, setQuickStatus] = useState<'published' | 'draft'>('published');

  // Next.js can preserve this client component while only the ?type query
  // changes. Keep the visible group synchronized with the sidebar URL.
  useEffect(() => {
    const nextTab = urlType === 'core' ? 'core' : urlType === 'seo' ? 'seo' : urlType === 'other' ? 'other' : 'all';
    setActiveTab(nextTab);
    setMode('list');
    setQuickEditSlug(null);
  }, [urlType]);

  // Load all pages
  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await referenceFetch('/api/admin/shared/pages', { cache: 'no-store' });
      const json = await res.json();
      let remotePages: AdminPageItem[] = [];
      if (json.success && Array.isArray(json.data)) {
        remotePages = json.data;
      }

      // Merge defaults for core and other pages if missing
      const slugMap = new Map<string, AdminPageItem>();

      // Defaults first
      DEFAULT_CORE_PAGES.forEach((p) => slugMap.set(p.slug, p));
      DEFAULT_OTHER_PAGES.forEach((p) => slugMap.set(p.slug, p));

      // Remote pages override
      remotePages.forEach((p) => {
        const cleanSlug = (p.slug || p.id || '').replace(/^\//, '');
        // Determine group
        let group: 'core' | 'seo' | 'other' = p.pageGroup || 'seo';
        if (!p.pageGroup) {
          if (['', 'shop', 'about-us', 'contact', 'blog'].includes(cleanSlug)) group = 'core';
          else if (['privacy-policy', 'privacy-policy-2', 'terms-conditions', 'shipping', 'returns-exchanges', 'services'].includes(cleanSlug)) group = 'other';
          else group = 'seo';
        }
        slugMap.set(cleanSlug, { ...p, slug: cleanSlug, pageGroup: group });
      });

      const merged = Array.from(slugMap.values());
      setPages(merged);

      // If pageSlug requested, open editor for that page
      if (pageSlug) {
        const target = cleanSlugParam(pageSlug);
        const found = merged.find((p) => p.slug === target || p.id === target);
        if (found) {
          setCurrentPage(JSON.parse(JSON.stringify(found)));
          setOriginalPageJson(JSON.stringify(found));
          setIsDirty(false);
          setMode('editor');
        } else if (isNew) {
          const fresh = emptyPage();
          setCurrentPage(fresh);
          setOriginalPageJson(JSON.stringify(fresh));
          setIsDirty(false);
          setMode('editor');
        }
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, [pageSlug]);

  const cleanSlugParam = (slug: string) => slug.replace(/^\//, '').replace(/\/$/, '');

  // Detect unsaved changes
  const checkDirty = (page: AdminPageItem) => {
    if (!originalPageJson) return false;
    return JSON.stringify(page) !== originalPageJson;
  };

  const updatePage = (changes: Partial<AdminPageItem>) => {
    setCurrentPage((prev) => {
      const next = { ...prev, ...changes };
      setIsDirty(checkDirty(next));
      return next;
    });
  };

  // Open editor for a page
  const openEditor = (page: AdminPageItem) => {
    setCurrentPage(JSON.parse(JSON.stringify(page)));
    setOriginalPageJson(JSON.stringify(page));
    setIsDirty(false);
    setMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openNewPage = () => {
    const group: 'core' | 'seo' | 'other' = activeTab === 'core' ? 'core' : activeTab === 'other' ? 'other' : 'seo';
    const fresh = emptyPage(group);
    setCurrentPage(fresh);
    setOriginalPageJson(JSON.stringify(fresh));
    setIsDirty(false);
    setMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    if (isDirty) {
      setShowLeaveModal(true);
    } else {
      setMode('list');
    }
  };

  // Save page changes
  const handleSavePage = async () => {
    if (!currentPage.title.trim()) {
      alert('Please enter a page title.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const cleanSlug = currentPage.slug.trim() ? slugify(currentPage.slug) : slugify(currentPage.title);
      const updatedItem: AdminPageItem = {
        ...currentPage,
        id: currentPage.id || cleanSlug,
        slug: cleanSlug,
        status: currentPage.status || 'published',
        seoTitle: currentPage.seoTitle?.trim() || currentPage.title,
        seoDescription: currentPage.seoDescription?.trim() || currentPage.description || '',
        updatedAt: new Date().toISOString()
      };

      // Update in memory list
      const nextPages = pages.some((p) => p.slug === cleanSlug || p.id === updatedItem.id)
        ? pages.map((p) => (p.slug === cleanSlug || p.id === updatedItem.id ? updatedItem : p))
        : [updatedItem, ...pages];

      // Save to CRM backend
      const res = await referenceFetch('/api/admin/shared/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Merge only the edited page. Sending all recovered pages on every
        // save was unnecessarily large and could fail at the proxy boundary.
        body: JSON.stringify({ data: [updatedItem] })
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error || `Save failed (${res.status})`);
      }

      setPages(nextPages);
      setCurrentPage(updatedItem);
      setOriginalPageJson(JSON.stringify(updatedItem));
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save page:', err);
      alert('Could not save page to shared database. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  // Quick edit handlers
  const startQuickEdit = (p: AdminPageItem) => {
    if (quickEditSlug === p.slug) {
      setQuickEditSlug(null);
    } else {
      setQuickEditSlug(p.slug);
      setQuickTitle(p.title);
      setQuickSlugValue(p.slug);
      setQuickGroup(p.pageGroup || 'seo');
      setQuickStatus(p.status);
    }
  };

  const saveQuickEdit = async (slug: string) => {
    const nextPages = pages.map((p) => {
      if (p.slug === slug) {
        return {
          ...p,
          title: quickTitle,
          slug: quickSlugValue ? slugify(quickSlugValue) : p.slug,
          pageGroup: quickGroup,
          status: quickStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    const updatedItem = nextPages.find((page) => page.slug === (quickSlugValue ? slugify(quickSlugValue) : slug));
    try {
      const response = await referenceFetch('/api/admin/shared/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedItem ? [updatedItem] : [] })
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Update failed');
      setPages(nextPages);
      setQuickEditSlug(null);
    } catch (err) {
      alert('Failed to update page');
    }
  };

  const deletePage = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    const nextPages = pages.filter((p) => p.slug !== slug);
    try {
      const target = pages.find((page) => page.slug === slug);
      const response = await referenceFetch('/api/admin/shared/pages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target?.id || slug })
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Delete failed');
      setPages(nextPages);
    } catch (err) {
      alert('Failed to delete page');
    }
  };

  // Add / Remove sections in Editor
  const addSection = () => {
    const next = [
      ...currentPage.sections,
      {
        title: `Section ${currentPage.sections.length + 1}`,
        paragraphs: ['']
      }
    ];
    updatePage({ sections: next });
  };

  const removeSection = (index: number) => {
    const next = currentPage.sections.filter((_, i) => i !== index);
    updatePage({ sections: next });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= currentPage.sections.length) return;
    const next = [...currentPage.sections];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    updatePage({ sections: next });
  };

  const updateSectionTitle = (index: number, title: string) => {
    const next = [...currentPage.sections];
    next[index] = { ...next[index], title };
    updatePage({ sections: next });
  };

  const addParagraphToSection = (sectionIndex: number) => {
    const next = [...currentPage.sections];
    next[sectionIndex] = {
      ...next[sectionIndex],
      paragraphs: [...next[sectionIndex].paragraphs, '']
    };
    updatePage({ sections: next });
  };

  const updateParagraph = (sectionIndex: number, pIndex: number, text: string) => {
    const next = [...currentPage.sections];
    const paras = [...next[sectionIndex].paragraphs];
    paras[pIndex] = text;
    next[sectionIndex] = { ...next[sectionIndex], paragraphs: paras };
    updatePage({ sections: next });
  };

  const removeParagraph = (sectionIndex: number, pIndex: number) => {
    const next = [...currentPage.sections];
    const paras = next[sectionIndex].paragraphs.filter((_, i) => i !== pIndex);
    next[sectionIndex] = { ...next[sectionIndex], paragraphs: paras.length ? paras : [''] };
    updatePage({ sections: next });
  };

  const addPointToSection = (sectionIndex: number) => {
    const next = [...currentPage.sections];
    const currentPoints = next[sectionIndex].points || [];
    next[sectionIndex] = {
      ...next[sectionIndex],
      points: [...currentPoints, '']
    };
    updatePage({ sections: next });
  };

  const updatePoint = (sectionIndex: number, ptIndex: number, text: string) => {
    const next = [...currentPage.sections];
    const pts = [...(next[sectionIndex].points || [])];
    pts[ptIndex] = text;
    next[sectionIndex] = { ...next[sectionIndex], points: pts };
    updatePage({ sections: next });
  };

  const removePoint = (sectionIndex: number, ptIndex: number) => {
    const next = [...currentPage.sections];
    const pts = (next[sectionIndex].points || []).filter((_, i) => i !== ptIndex);
    next[sectionIndex] = { ...next[sectionIndex], points: pts };
    updatePage({ sections: next });
  };

  // FAQ Handlers
  const addFAQ = () => {
    const next = [...(currentPage.faqs || []), { question: '', answer: '' }];
    updatePage({ faqs: next });
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const next = [...(currentPage.faqs || [])];
    next[index] = { ...next[index], [field]: value };
    updatePage({ faqs: next });
  };

  const removeFAQ = (index: number) => {
    const next = (currentPage.faqs || []).filter((_, i) => i !== index);
    updatePage({ faqs: next });
  };

  // Counts for tabs
  const counts = useMemo(() => {
    const core = pages.filter((p) => p.pageGroup === 'core').length;
    const seo = pages.filter((p) => p.pageGroup === 'seo' || !p.pageGroup).length;
    const other = pages.filter((p) => p.pageGroup === 'other').length;
    const published = pages.filter((p) => p.status === 'published').length;
    const draft = pages.filter((p) => p.status === 'draft').length;
    return { all: pages.length, core, seo, other, published, draft };
  }, [pages]);

  // Filtered pages for table
  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      // Group tab
      if (activeTab === 'core' && p.pageGroup !== 'core') return false;
      if (activeTab === 'seo' && p.pageGroup !== 'seo' && p.pageGroup) return false;
      if (activeTab === 'other' && p.pageGroup !== 'other') return false;

      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // Search query
      if (query.trim()) {
        const q = query.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inSlug = p.slug.toLowerCase().includes(q);
        const inDesc = (p.description || '').toLowerCase().includes(q);
        const inSections = p.sections.some((s) => s.title.toLowerCase().includes(q) || s.paragraphs.some((pr) => pr.toLowerCase().includes(q)));
        if (!inTitle && !inSlug && !inDesc && !inSections) return false;
      }
      return true;
    });
  }, [pages, activeTab, statusFilter, query]);

  // SEO Snippet preview calculations
  const displaySeoTitle = currentPage.seoTitle || currentPage.title || 'Untitled Page';
  const displaySeoSlug = currentPage.slug || slugify(currentPage.title) || 'page-slug';
  const displaySeoDesc = currentPage.seoDescription || currentPage.description || 'Provide a compelling description for search engine results.';

  // Render Editor Mode
  if (mode === 'editor') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
        {/* Top Sticky Navigation Bar */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #e2e8f0',
            padding: '12px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={handleBackToList}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '7px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            >
              <ArrowLeft size={16} />
              <span>Back to Pages</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Editing:</span>
              <strong style={{ fontSize: '0.92rem', color: '#0f172a', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentPage.title || 'Untitled Page'}
              </strong>
              {isDirty && (
                <span style={{ fontSize: '0.72rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live Status Toggle */}
            <button
              onClick={() => updatePage({ status: currentPage.status === 'published' ? 'draft' : 'published' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: currentPage.status === 'published' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                backgroundColor: currentPage.status === 'published' ? '#f0fdf4' : '#f8fafc',
                color: currentPage.status === 'published' ? '#16a34a' : '#64748b',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: currentPage.status === 'published' ? '#16a34a' : '#94a3b8'
                }}
              />
              <span>{currentPage.status === 'published' ? 'Published' : 'Draft'}</span>
            </button>

            {/* View Live Page */}
            {currentPage.slug && (
              <Link
                href={currentPage.slug ? `/${currentPage.slug}` : '/'}
                target="_blank"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '7px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={15} />
                <span>View Live ↗</span>
              </Link>
            )}

            {/* SEO Snippet Modal Trigger */}
            <button
              onClick={() => setSeoModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '7px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Globe size={15} color="#51b291" />
              <span>SEO Snippet</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSavePage}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 18px',
                borderRadius: '7px',
                backgroundColor: saveSuccess ? '#16a34a' : '#51b291',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'background-color 0.2s ease'
              }}
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Page</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px', alignItems: 'start' }}>
          {/* Main Column: Content Sections & Copy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title & Slug Header Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Page Title (H1)
                </label>
                <input
                  type="text"
                  value={currentPage.title}
                  onChange={(e) => updatePage({ title: e.target.value })}
                  placeholder="e.g. Dental Equipment Supplier in Dubai & UAE"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Permalink Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                  Permalink: https://www.gynaeq.com/
                </span>
                <input
                  type="text"
                  value={currentPage.slug}
                  onChange={(e) => updatePage({ slug: e.target.value })}
                  placeholder="url-slug"
                  style={{
                    flex: 1,
                    padding: '3px 8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#51b291',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Hero Copy & Introduction Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#51b291" />
                <span>Hero & Introduction Copy</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                    Eyebrow / Badge Text
                  </label>
                  <input
                    type="text"
                    value={currentPage.eyebrow || ''}
                    onChange={(e) => updatePage({ eyebrow: e.target.value })}
                    placeholder="e.g. GYNAEQ UAE or Specialist Dental Solutions"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.86rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                    Introduction / Hero Description
                  </label>
                  <textarea
                    rows={4}
                    value={currentPage.description || ''}
                    onChange={(e) => updatePage({ description: e.target.value })}
                    placeholder="Provide a high-converting opening paragraph for this healthcare page..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '0.88rem',
                      lineHeight: '1.5',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Structured Content Sections Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="#51b291" />
                    <span>Content Sections ({currentPage.sections.length})</span>
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    Add rich editorial headings, paragraphs, and key feature lists for this page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSection}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    backgroundColor: '#eaf7f2',
                    color: '#2f6b57',
                    border: '1px solid #a7e1cd',
                    borderRadius: '7px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} />
                  <span>Add Section</span>
                </button>
              </div>

              {/* Sections List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {currentPage.sections.map((section, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '18px'
                    }}
                  >
                    {/* Section Top Header & Ordering Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, backgroundColor: '#51b291', color: '#ffffff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {sIdx + 1}
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                          Section Heading (H2)
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => moveSection(sIdx, 'up')}
                          disabled={sIdx === 0}
                          title="Move section up"
                          style={{
                            padding: '4px 6px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '5px',
                            color: sIdx === 0 ? '#cbd5e1' : '#475569',
                            cursor: sIdx === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <MoveUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(sIdx, 'down')}
                          disabled={sIdx === currentPage.sections.length - 1}
                          title="Move section down"
                          style={{
                            padding: '4px 6px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '5px',
                            color: sIdx === currentPage.sections.length - 1 ? '#cbd5e1' : '#475569',
                            cursor: sIdx === currentPage.sections.length - 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <MoveDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(sIdx)}
                          title="Delete section"
                          style={{
                            padding: '4px 6px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fca5a5',
                            borderRadius: '5px',
                            color: '#b91c1c',
                            cursor: 'pointer',
                            marginLeft: '6px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Section Title Input */}
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                      placeholder="e.g. Importance of Choosing the Right Equipment"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '0.94rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        marginBottom: '14px'
                      }}
                    />

                    {/* Section Paragraphs */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                          Paragraphs ({section.paragraphs.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => addParagraphToSection(sIdx)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#51b291',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          + Add Paragraph
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {section.paragraphs.map((para, pIdx) => (
                          <div key={pIdx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <textarea
                              rows={3}
                              value={para}
                              onChange={(e) => updateParagraph(sIdx, pIdx, e.target.value)}
                              placeholder={`Paragraph ${pIdx + 1}...`}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                fontSize: '0.86rem',
                                lineHeight: '1.45',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                outline: 'none',
                                resize: 'vertical'
                              }}
                            />
                            {section.paragraphs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeParagraph(sIdx, pIdx)}
                                title="Delete paragraph"
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '6px',
                                  marginTop: '2px'
                                }}
                              >
                                <X size={15} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section Bullet Points (Optional) */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                          Key Points / Features ({section.points?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() => addPointToSection(sIdx)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#51b291',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          + Add Key Point
                        </button>
                      </div>

                      {section.points && section.points.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {section.points.map((pt, ptIdx) => (
                            <div key={ptIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ color: '#51b291', fontSize: '0.9rem' }}>•</span>
                              <input
                                type="text"
                                value={pt}
                                onChange={(e) => updatePoint(sIdx, ptIdx, e.target.value)}
                                placeholder="Key feature or point..."
                                style={{
                                  flex: 1,
                                  padding: '6px 10px',
                                  fontSize: '0.84rem',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  outline: 'none'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removePoint(sIdx, ptIdx)}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '4px'
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frequently Asked Questions Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HelpCircle size={18} color="#51b291" />
                    <span>Frequently Asked Questions ({currentPage.faqs?.length || 0})</span>
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    Add Q&A pairs for accordion display on the storefront and SEO FAQ Schema rich results.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFAQ}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    backgroundColor: '#eaf7f2',
                    color: '#2f6b57',
                    border: '1px solid #a7e1cd',
                    borderRadius: '7px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} />
                  <span>Add FAQ</span>
                </button>
              </div>

              {(!currentPage.faqs || currentPage.faqs.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.86rem' }}>
                  No FAQs added yet. Click &quot;Add FAQ&quot; to include question and answers.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {currentPage.faqs.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Question #{fIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFAQ(fIdx)}
                          title="Delete FAQ"
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFAQ(fIdx, 'question', e.target.value)}
                        placeholder="e.g. Do you provide installation and warranty in Dubai?"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                          marginBottom: '8px'
                        }}
                      />

                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => updateFAQ(fIdx, 'answer', e.target.value)}
                        placeholder="Answer details..."
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '0.84rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Settings & Hero Media */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Page Settings Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>
                Page Configuration
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                    Page Classification
                  </label>
                  <select
                    value={currentPage.pageGroup || 'seo'}
                    onChange={(e) => updatePage({ pageGroup: e.target.value as 'core' | 'seo' | 'other' })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="seo">SEO Landing Page (Dubai / UAE)</option>
                    <option value="core">Core Page (Home, Shop, About, Contact)</option>
                    <option value="other">Store & Legal Policy</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                    Publishing Status
                  </label>
                  <select
                    value={currentPage.status}
                    onChange={(e) => updatePage({ status: e.target.value as 'published' | 'draft' })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="published">Published (Live on website)</option>
                    <option value="draft">Draft (Hidden from public)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hero Image Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={16} color="#51b291" />
                <span>Hero / Featured Image</span>
              </h4>

              {currentPage.heroImage ? (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <img
                      src={currentPage.heroImage}
                      alt={currentPage.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePage({ heroImage: '' })}
                    style={{
                      marginTop: '8px',
                      fontSize: '0.78rem',
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Remove hero image
                  </button>
                </div>
              ) : (
                <div style={{ height: '90px', borderRadius: '8px', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.82rem', marginBottom: '12px' }}>
                  No hero image set
                </div>
              )}

              <input
                type="text"
                value={currentPage.heroImage || ''}
                onChange={(e) => updatePage({ heroImage: e.target.value })}
                placeholder="Image URL: /products/... or https://..."
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  outline: 'none'
                }}
              />
            </div>

            {/* Quick SEO Summary Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={16} color="#51b291" />
                  <span>Google Snippet</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSeoModalOpen(true)}
                  style={{ fontSize: '0.78rem', color: '#51b291', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Edit SEO
                </button>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, color: '#1a0dab', fontSize: '0.84rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displaySeoTitle}
                </div>
                <div style={{ color: '#006621', fontSize: '0.74rem', marginBottom: '4px' }}>
                  https://www.gynaeq.com/{displaySeoSlug}
                </div>
                <div style={{ color: '#4d5156', fontSize: '0.76rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {displaySeoDesc}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Snippet Modal */}
        {seoModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                padding: '28px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Globe size={22} color="#51b291" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Google Search Preview Snippet
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSeoModalOpen(false)}
                  style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Device Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setSeoPreviewTab('desktop')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: seoPreviewTab === 'desktop' ? '#51b291' : '#e2e8f0',
                    backgroundColor: seoPreviewTab === 'desktop' ? '#eaf7f2' : '#ffffff',
                    color: seoPreviewTab === 'desktop' ? '#2f6b57' : '#64748b',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Monitor size={14} />
                  <span>Desktop Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSeoPreviewTab('mobile')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: seoPreviewTab === 'mobile' ? '#51b291' : '#e2e8f0',
                    backgroundColor: seoPreviewTab === 'mobile' ? '#eaf7f2' : '#ffffff',
                    color: seoPreviewTab === 'mobile' ? '#2f6b57' : '#64748b',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={14} />
                  <span>Mobile Preview</span>
                </button>
              </div>

              {/* Realistic Google Search Card */}
              <div
                style={{
                  border: '1px solid #dadce0',
                  borderRadius: seoPreviewTab === 'mobile' ? '12px' : '8px',
                  padding: '16px 20px',
                  backgroundColor: '#ffffff',
                  marginBottom: '24px',
                  maxWidth: seoPreviewTab === 'mobile' ? '420px' : '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#51b291', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                    F
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#202124', lineHeight: 1.2 }}>
                      GYNAEQ Medical
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#4d5156', lineHeight: 1.2 }}>
                      https://www.gynaeq.com &gt; {displaySeoSlug}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: seoPreviewTab === 'mobile' ? '1rem' : '1.15rem', color: '#1a0dab', fontWeight: 500, lineHeight: 1.3, marginBottom: '6px' }}>
                  {displaySeoTitle} | GYNAEQ Dubai & UAE
                </div>

                <div style={{ fontSize: '0.84rem', color: '#4d5156', lineHeight: 1.45 }}>
                  {displaySeoDesc}
                </div>
              </div>

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                      SEO Title
                    </label>
                    <span style={{ fontSize: '0.76rem', color: displaySeoTitle.length > 60 ? '#e11d48' : '#64748b' }}>
                      {displaySeoTitle.length} / 60 characters
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentPage.seoTitle || ''}
                    onChange={(e) => updatePage({ seoTitle: e.target.value })}
                    placeholder={currentPage.title}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.88rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                      Meta Description
                    </label>
                    <span style={{ fontSize: '0.76rem', color: displaySeoDesc.length > 160 ? '#e11d48' : '#64748b' }}>
                      {displaySeoDesc.length} / 160 characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={currentPage.seoDescription || ''}
                    onChange={(e) => updatePage({ seoDescription: e.target.value })}
                    placeholder={currentPage.description}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.86rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSeoModalOpen(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '7px',
                    backgroundColor: '#51b291',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Confirmation Dialog */}
        {showLeaveModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '24px',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Discard unsaved changes?
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    You have made edits to this page that will be lost.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Stay on Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    setMode('list');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Discard & Leave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render List Mode
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#51b291', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Content Management
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            {activeTab === 'core' ? 'Core Pages' : activeTab === 'seo' ? 'SEO Pages' : activeTab === 'other' ? 'Other Pages' : 'Website Pages'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Manage website pages, clinical equipment guides, SEO landing pages, and legal policies. Click any page to edit content.
          </p>
        </div>

        <button
          onClick={openNewPage}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 18px',
            backgroundColor: '#51b291',
            color: '#ffffff',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#429a7c')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#51b291')}
        >
          <Plus size={16} />
          <span>Add New Page</span>
        </button>
      </div>

      {/* Tabs Filter Bar (All / Core / SEO / Other) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}
      >
        <button
          onClick={() => setActiveTab('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            border: 'none',
            background: 'none',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'all' ? 700 : 500,
            color: activeTab === 'all' ? '#51b291' : '#64748b',
            borderBottom: activeTab === 'all' ? '2px solid #51b291' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer'
          }}
        >
          <span>All Pages</span>
          <span style={{ fontSize: '0.74rem', backgroundColor: activeTab === 'all' ? '#eaf7f2' : '#f1f5f9', color: activeTab === 'all' ? '#2f6b57' : '#64748b', padding: '1px 7px', borderRadius: '10px' }}>
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('core')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            border: 'none',
            background: 'none',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'core' ? 700 : 500,
            color: activeTab === 'core' ? '#51b291' : '#64748b',
            borderBottom: activeTab === 'core' ? '2px solid #51b291' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer'
          }}
        >
          <span>Core Pages</span>
          <span style={{ fontSize: '0.74rem', backgroundColor: activeTab === 'core' ? '#eaf7f2' : '#f1f5f9', color: activeTab === 'core' ? '#2f6b57' : '#64748b', padding: '1px 7px', borderRadius: '10px' }}>
            {counts.core}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            border: 'none',
            background: 'none',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'seo' ? 700 : 500,
            color: activeTab === 'seo' ? '#51b291' : '#64748b',
            borderBottom: activeTab === 'seo' ? '2px solid #51b291' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer'
          }}
        >
          <span>SEO Pages</span>
          <span style={{ fontSize: '0.74rem', backgroundColor: activeTab === 'seo' ? '#eaf7f2' : '#f1f5f9', color: activeTab === 'seo' ? '#2f6b57' : '#64748b', padding: '1px 7px', borderRadius: '10px' }}>
            {counts.seo}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('other')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            border: 'none',
            background: 'none',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'other' ? 700 : 500,
            color: activeTab === 'other' ? '#51b291' : '#64748b',
            borderBottom: activeTab === 'other' ? '2px solid #51b291' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer'
          }}
        >
          <span>Other Pages</span>
          <span style={{ fontSize: '0.74rem', backgroundColor: activeTab === 'other' ? '#eaf7f2' : '#f1f5f9', color: activeTab === 'other' ? '#2f6b57' : '#64748b', padding: '1px 7px', borderRadius: '10px' }}>
            {counts.other}
          </span>
        </button>
      </div>

      {/* Main Container Card: Search, Filter, and Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}
      >
        {/* Toolbar */}
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
          {/* Search Box */}
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
              borderRadius: '8px'
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, url, or content..."
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.86rem',
                backgroundColor: 'transparent',
                color: '#0f172a'
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

          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SlidersHorizontal size={14} color="#64748b" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.84rem',
                fontWeight: 500,
                backgroundColor: '#ffffff',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Pages Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 18px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Page Name &amp; URL
                </th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Group
                </th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status
                </th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sections
                </th>
                <th style={{ padding: '12px 18px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => {
                const isQuick = quickEditSlug === page.slug;

                return (
                  <React.Fragment key={page.id || page.slug}>
                    <tr
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease'
                      }}
                      className="group"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafcfb')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      {/* Name & URL */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {/* Green Cube Icon Box matching screenshot */}
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              backgroundColor: '#eaf7f2',
                              border: '1px solid #cceee2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#51b291',
                              flexShrink: 0
                            }}
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                              <polyline points="3.29 7 12 12 20.71 7" />
                              <line x1="12" y1="22" x2="12" y2="12" />
                            </svg>
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            {/* Clickable Title to Edit */}
                            <button
                              type="button"
                              onClick={() => openEditor(page)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                textAlign: 'left',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                color: '#0f172a',
                                cursor: 'pointer',
                                display: 'block',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#51b291')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                            >
                              {page.title}
                            </button>

                            {/* Slug Subtitle */}
                            <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px', fontWeight: 500 }}>
                              /{page.slug}
                            </div>

                            {/* WordPress-style Row Hover Actions */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 600
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => openEditor(page)}
                                style={{ background: 'none', border: 'none', padding: 0, color: '#51b291', cursor: 'pointer', fontWeight: 700 }}
                              >
                                Edit
                              </button>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <button
                                type="button"
                                onClick={() => startQuickEdit(page)}
                                style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}
                              >
                                Quick Edit
                              </button>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <button
                                type="button"
                                onClick={() => deletePage(page.slug)}
                                style={{ background: 'none', border: 'none', padding: 0, color: '#ef4444', cursor: 'pointer' }}
                              >
                                Trash
                              </button>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <Link
                                href={page.slug ? `/${page.slug}` : '/'}
                                target="_blank"
                                style={{ color: '#475569', textDecoration: 'none' }}
                              >
                                View ↗
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group Badge */}
                      <td style={{ padding: '14px 14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: page.pageGroup === 'core' ? '#eff6ff' : page.pageGroup === 'seo' ? '#f0fdf4' : '#f8fafc',
                            color: page.pageGroup === 'core' ? '#1d4ed8' : page.pageGroup === 'seo' ? '#166534' : '#475569',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700
                          }}
                        >
                          {page.pageGroup === 'core' ? 'Core Page' : page.pageGroup === 'seo' ? 'SEO Landing' : 'Website Page'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: page.status === 'published' ? '#f0fdf4' : '#f8fafc',
                            color: page.status === 'published' ? '#16a34a' : '#64748b',
                            border: page.status === 'published' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                            padding: '3px 9px',
                            borderRadius: '20px',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: page.status === 'published' ? '#16a34a' : '#94a3b8'
                            }}
                          />
                          <span>{page.status === 'published' ? 'Live' : 'Draft'}</span>
                        </span>
                      </td>

                      {/* Sections Count */}
                      <td style={{ padding: '14px 14px', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                        {page.sections?.length || 0} sections
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditor(page)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <Link
                            href={page.slug ? `/${page.slug}` : '/'}
                            target="_blank"
                            title="View page in storefront"
                            style={{
                              padding: '6px',
                              color: '#64748b',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none'
                            }}
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>

                    {/* Quick Edit Row */}
                    {isQuick && (
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #51b291' }}>
                        <td colSpan={5} style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                              Quick Edit
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={quickTitle}
                                  onChange={(e) => setQuickTitle(e.target.value)}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.84rem', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>
                                  Slug
                                </label>
                                <input
                                  type="text"
                                  value={quickSlugValue}
                                  onChange={(e) => setQuickSlugValue(e.target.value)}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.84rem', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>
                                  Group
                                </label>
                                <select
                                  value={quickGroup}
                                  onChange={(e) => setQuickGroup(e.target.value as 'core' | 'seo' | 'other')}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.84rem', borderRadius: '5px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                                >
                                  <option value="seo">SEO Page</option>
                                  <option value="core">Core Page</option>
                                  <option value="other">Other Page</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>
                                  Status
                                </label>
                                <select
                                  value={quickStatus}
                                  onChange={(e) => setQuickStatus(e.target.value as 'published' | 'draft')}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.84rem', borderRadius: '5px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                                >
                                  <option value="published">Published</option>
                                  <option value="draft">Draft</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => setQuickEditSlug(null)}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '5px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveQuickEdit(page.slug)}
                                style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '5px', border: 'none', backgroundColor: '#51b291', color: '#ffffff', cursor: 'pointer' }}
                              >
                                Update
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filteredPages.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
              <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '4px' }}>
                No pages match your filter
              </div>
              <p style={{ fontSize: '0.84rem', margin: 0 }}>
                Try adjusting your search query or switching tabs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
