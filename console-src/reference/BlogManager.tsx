import {referenceFetch} from '../api';
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Fragment } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Code,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Heading2,
  Highlighter,
  Image as ImageIcon,
  Link2,
  List,
  ListTree,
  MoreVertical,
  PenLine,
  Plus,
  Quote,
  Redo2,
  Save,
  Search,
  Settings2,
  Strikethrough,
  Table2,
  Trash2,
  Type,
  Undo2,
  User,
  X
} from "lucide-react";

export type BlockType =
  | "paragraph"
  | "heading"
  | "heading2"
  | "heading3"
  | "heading4"
  | "list"
  | "quote"
  | "code"
  | "table"
  | "image";

export type Block = { id: string; type: BlockType; content: string };
export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  blocks?: Block[];
  category: string;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  author: string;
  authorRole?: string;
  authorImage?: string;
  reviewer?: string;
  reviewerRole?: string;
  reviewerImage?: string;
  showByline?: boolean;
  showAuthor?: boolean;
  showReviewer?: boolean;
  publishedAt?: string;
  updatedAt: string;
};

type Category = { id: string; name: string; slug: string; description: string };
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const block = (type: BlockType = "paragraph"): Block => ({ id: uid(), type, content: "" });
const emptyPost = (): Post => ({
  id: `post-${Date.now()}`,
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  blocks: [block()],
  category: "",
  tags: [],
  status: "draft",
  featuredImage: "",
  seoTitle: "",
  seoDescription: "",
  author: "GYNAEQ Team",
  authorRole: "Medical content team",
  reviewer: "",
  reviewerRole: "Medical reviewer",
  showByline: false,
  showAuthor: true,
  showReviewer: false,
  updatedAt: new Date().toISOString()
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const serialize = (blocks: Block[]) =>
  blocks
    .map((b) => {
      const s = b.content;
      if (b.type === "heading" || b.type === "heading2") return `<h2>${s}</h2>`;
      if (b.type === "heading3") return `<h3>${s}</h3>`;
      if (b.type === "heading4") return `<h4>${s}</h4>`;
      if (b.type === "quote") return `<blockquote>${s}</blockquote>`;
      if (b.type === "list") {
        const lines = s
          .replace(/<br\s*[\/]?>/gi, "\n")
          .replace(/<\/?[^>]+(>|$)/g, "\n")
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);
        return `<ul>${lines.map((x) => `<li>${x}</li>`).join("")}</ul>`;
      }
      if (b.type === "code") return `<pre><code>${s}</code></pre>`;
      if (b.type === "image") return s ? `<img src="${s}" alt="" />` : "";
      if (b.type === "table") return `<pre>${s}</pre>`;
      return `<p>${s}</p>`;
    })
    .join("\n");

async function load(dataset: string) {
  const r = await referenceFetch(`/api/admin/shared/${dataset}`, { cache: "no-store" });
  const x = await r.json();
  return x.data || [];
}

async function save(dataset: string, data: unknown[]) {
  const r = await referenceFetch(`/api/admin/shared/${dataset}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ replace: true, data })
  });
  if (!r.ok) throw new Error("Save failed");
}

export default function BlogManager({
  mode,
  postId
}: {
  mode: "list" | "editor" | "categories";
  postId?: string;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [post, setPost] = useState<Post>(emptyPost());
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const [inserter, setInserter] = useState(false);
  const [seo, setSeo] = useState(false);
  const [history, setHistory] = useState<Post[]>([]);
  const [future, setFuture] = useState<Post[]>([]);

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [alignMenuOpen, setAlignMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // List view states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSlug, setQuickSlug] = useState("");
  const [quickDate, setQuickDate] = useState("");
  const [quickAuthor, setQuickAuthor] = useState("GYNAEQ Team");
  const [quickCategory, setQuickCategory] = useState("");
  const [quickCategories, setQuickCategories] = useState<string[]>([]);
  const [quickTags, setQuickTags] = useState("");
  const [quickAllowComments, setQuickAllowComments] = useState(true);
  const [quickAllowPings, setQuickAllowPings] = useState(true);
  const [quickStatus, setQuickStatus] = useState<"draft" | "published">("published");

  const availableCategories = useMemo(() => {
    const defaultList = [
      "Agriculture and Forestry",
      "Airlines and Aviation",
      "Architecture and Planning",
      "Automotive",
      "Banking",
      "Biomedical Engineering",
      "Hospital Equipment",
      "Clinical Devices",
      "Dental Technology",
      "Healthcare UAE"
    ];
    const catNames = categories.map((c) => c.name);
    return Array.from(new Set([...defaultList, ...catNames]));
  }, [categories]);

  const startQuickEdit = (p: Post) => {
    if (quickEditId === p.id) {
      setQuickEditId(null);
    } else {
      setQuickEditId(p.id);
      setQuickTitle(p.title);
      setQuickSlug(p.slug);
      const postCats = p.category ? [p.category] : [];
      setQuickCategory(p.category || "");
      setQuickCategories(postCats);
      setQuickAuthor(p.author || "GYNAEQ Team");
      setQuickTags(Array.isArray(p.tags) ? p.tags.join(", ") : "");

      // Format date for type="date" (YYYY-MM-DD)
      const d = p.publishedAt || p.updatedAt ? new Date(p.publishedAt || p.updatedAt) : new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setQuickDate(`${yyyy}-${mm}-${dd}`);

      setQuickAllowComments(true);
      setQuickAllowPings(true);
      setQuickStatus(p.status === "published" ? "published" : "draft");
    }
  };

  const saveQuickEdit = async (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        const cat = quickCategories.length > 0 ? quickCategories[0] : quickCategory;
        const tagsArr = quickTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        return {
          ...p,
          title: quickTitle,
          slug: quickSlug || slugify(quickTitle),
          category: cat,
          author: quickAuthor,
          tags: tagsArr,
          status: quickStatus,
          publishedAt: quickDate ? new Date(quickDate).toISOString() : p.publishedAt,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    await save("posts", updated);
    setPosts(updated);
    setQuickEditId(null);
  };

  const deletePost = async (id: string) => {
    if (!confirm("Move this post to trash?")) return;
    const all = posts.filter((x) => x.id !== id);
    await save("posts", all);
    setPosts(all);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const router = useRouter();

  const [draftSeoTitle, setDraftSeoTitle] = useState("");
  const [draftSeoSlug, setDraftSeoSlug] = useState("");
  const [draftSeoDesc, setDraftSeoDesc] = useState("");

  const openSeoModal = () => {
    setDraftSeoTitle(post.seoTitle || post.title || "");
    setDraftSeoSlug(post.slug || slugify(post.title) || "");
    setDraftSeoDesc(post.seoDescription || post.excerpt || "");
    setSeo(true);
  };

  const imageInput = useRef<HTMLInputElement>(null);
  const authorImgRef = useRef<HTMLInputElement>(null);
  const reviewerImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([load("posts"), load("post-categories")]).then(([p, c]) => {
      setPosts(p);
      setCategories(c);
      if (postId) {
        const found = p.find((x: Post) => x.id === postId || x.slug === postId);
        if (found) {
          const bs = found.blocks?.length
            ? found.blocks
            : [{ id: uid(), type: "paragraph" as BlockType, content: found.content || "" }];
          setPost({ ...found, blocks: bs });
          if (bs.length) setActiveBlockId(bs[0].id);
        }
      }
    });
  }, [postId]);

  const update = (changes: Partial<Post>) => {
    setHistory((h) => [...h.slice(-29), post]);
    setFuture([]);
    setPost((p) => ({ ...p, ...changes }));
  };

  const blocks = post.blocks || [];
  const setBlocks = (next: Block[]) => update({ blocks: next, content: serialize(next) });

  const addBlock = (type: BlockType) => {
    const newB = block(type);
    setBlocks([...blocks, newB]);
    setActiveBlockId(newB.id);
    setInserter(false);
  };

  const persistPost = async (status = post.status) => {
    const slug = post.slug || slugify(post.title);
    const next = {
      ...post,
      status,
      slug,
      content: serialize(blocks),
      seoTitle: post.seoTitle || post.title,
      updatedAt: new Date().toISOString(),
      publishedAt:
        status === "published"
          ? post.publishedAt || new Date().toISOString()
          : post.publishedAt
    };
    const all = [next, ...posts.filter((p) => p.id !== next.id)];
    await save("posts", all);
    setPosts(all);
    setPost(next);
    setMessage(status === "published" ? "Post published" : "Draft saved");
    setTimeout(() => setMessage(""), 2500);
  };

  const undo = () =>
    setHistory((h) => {
      if (!h.length) return h;
      setFuture((f) => [post, ...f]);
      setPost(h[h.length - 1]);
      return h.slice(0, -1);
    });

  const redo = () =>
    setFuture((f) => {
      if (!f.length) return f;
      setHistory((h) => [...h, post]);
      setPost(f[0]);
      return f.slice(1);
    });

  const filtered = useMemo(
    () =>
      posts.filter((p) =>
        `${p.title} ${p.category} ${p.status}`.toLowerCase().includes(query.toLowerCase())
      ),
    [posts, query]
  );

  const upload = (key: "featuredImage" | "authorImage" | "reviewerImage") => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ [key]: String(reader.result) });
    reader.readAsDataURL(file);
  };

  // Text formatting commands
  const applyFormat = (cmd: string, val: string | null = null) => {
    document.execCommand(cmd, false, val ?? undefined);
    if (activeBlockId) {
      const el = document.getElementById(`fm-block-content-${activeBlockId}`);
      if (el) {
        setBlocks(
          blocks.map((b) => (b.id === activeBlockId ? { ...b, content: el.innerHTML } : b))
        );
      }
    }
  };

  const applyLink = () => {
    const url = prompt("Enter link URL:", "https://");
    if (url) applyFormat("createLink", url);
  };

  const applyHighlight = () => {
    applyFormat("hiliteColor", "#fecdd3");
  };

  const applyInlineCode = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const code = document.createElement("code");
      code.textContent = sel.toString();
      range.deleteContents();
      range.insertNode(code);
      if (activeBlockId) {
        const el = document.getElementById(`fm-block-content-${activeBlockId}`);
        if (el) {
          setBlocks(
            blocks.map((b) => (b.id === activeBlockId ? { ...b, content: el.innerHTML } : b))
          );
        }
      }
    }
  };

  const changeActiveBlockType = (type: BlockType) => {
    if (!activeBlockId) return;
    setBlocks(blocks.map((b) => (b.id === activeBlockId ? { ...b, type } : b)));
    setTypeMenuOpen(false);
  };

  const getBlockTypeMeta = (type: BlockType) => {
    switch (type) {
      case "heading":
      case "heading2":
        return { icon: <span style={{ fontWeight: 800, fontSize: 13 }}>H2</span>, label: "Heading 2" };
      case "heading3":
        return { icon: <span style={{ fontWeight: 800, fontSize: 13 }}>H3</span>, label: "Heading 3" };
      case "heading4":
        return { icon: <span style={{ fontWeight: 800, fontSize: 13 }}>H4</span>, label: "Heading 4" };
      case "list":
        return { icon: <List size={15} />, label: "Bullet List" };
      case "quote":
        return { icon: <Quote size={15} />, label: "Quote" };
      case "code":
        return { icon: <Code size={15} />, label: "Code Block" };
      default:
        return { icon: <AlignLeft size={15} />, label: "Paragraph" };
    }
  };

  const activeBlock = blocks.find((b) => b.id === activeBlockId);

  if (mode === "categories")
    return (
      <>
        <AdminTitle
          title="Post Categories"
          action={
            <button
              className="tk-page-action"
              onClick={async () => {
                if (!newCategory.trim()) return;
                const item = {
                  id: `cat-${Date.now()}`,
                  name: newCategory.trim(),
                  slug: slugify(newCategory),
                  description: ""
                };
                const all = [...categories, item];
                await save("post-categories", all);
                setCategories(all);
                setNewCategory("");
              }}
            >
              Add Category
            </button>
          }
        />
        <main className="tk-editor-page">
          <div className="tk-panel tk-category-editor">
            <label>
              New category name
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            </label>
          </div>
          <div className="tk-panel">
            <table className="tk-admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Posts</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <b>{c.name}</b>
                    </td>
                    <td>/{c.slug}</td>
                    <td>{posts.filter((p) => p.category === c.name).length}</td>
                    <td>
                      <button
                        onClick={async () => {
                          const all = categories.filter((x) => x.id !== c.id);
                          await save("post-categories", all);
                          setCategories(all);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </>
    );

  if (mode === "list")
    return (
      <>
        <AdminTitle
          title="Posts"
          action={
            <Link className="tk-page-action" href="/admin/content/blog/new">
              <Plus size={15} /> Add Post
            </Link>
          }
        />
        <main className="tk-editor-page">
          <div className="tk-list-tools">
            <label>
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts…"
              />
            </label>
            <Link href="/admin/content/blog/categories">Manage categories</Link>
          </div>
          <div className="tk-panel">
            {selectedIds.length > 0 && (
              <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <span><b>{selectedIds.length}</b> selected</span>
                <button
                  type="button"
                  style={{ padding: "4px 10px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  onClick={async () => {
                    if (!confirm(`Move ${selectedIds.length} posts to trash?`)) return;
                    const all = posts.filter((x) => !selectedIds.includes(x.id));
                    await save("posts", all);
                    setPosts(all);
                    setSelectedIds([]);
                  }}
                >
                  Move to Trash
                </button>
              </div>
            )}
            <table className="tk-admin-table">
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>ARTICLE &amp; TITLE</th>
                  <th>AUTHOR</th>
                  <th>CATEGORIES</th>
                  <th>STATUS</th>
                  <th>DATE &amp; VIEWS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isQuick = quickEditId === p.id;
                  return (
                    <Fragment key={p.id}>
                      <tr className="fm-post-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(p.id)}
                          />
                        </td>
                        <td>
                          <div className="fm-title-cell">
                            <div className="fm-post-icon-box">
                              <FileText size={18} />
                            </div>
                            <div className="fm-post-details">
                              <Link href={`/admin/content/blog/${p.id}`} className="fm-post-row-title">
                                {p.title || "Untitled post"}
                              </Link>
                              <div className="fm-post-subline">
                                <span className="fm-post-slug-chip">/{p.slug}</span>
                                <span className="fm-action-dot">·</span>
                                <div className="fm-row-hover-actions">
                                  <Link href={`/admin/content/blog/${p.id}`} className="fm-row-action">
                                    Edit
                                  </Link>
                                  <span className="fm-action-dot">·</span>
                                  <button
                                    type="button"
                                    className="fm-row-action"
                                    onClick={() => startQuickEdit(p)}
                                  >
                                    Quick Edit
                                  </button>
                                  <span className="fm-action-dot">·</span>
                                  <button
                                    type="button"
                                    className="fm-row-action danger"
                                    onClick={() => deletePost(p.id)}
                                  >
                                    Trash
                                  </button>
                                  <span className="fm-action-dot">·</span>
                                  <Link
                                    href={`/blog/${p.slug}`}
                                    target="_blank"
                                    className="fm-row-action"
                                  >
                                    View <ExternalLink size={11} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="fm-author-cell">
                            <span className="fm-author-badge">
                              {(p.author || "T")[0].toUpperCase()}
                            </span>
                            <span>{p.author || "GYNAEQ"}</span>
                          </div>
                        </td>
                        <td>{p.category || "Uncategorised"}</td>
                        <td>
                          <span className={`tk-post-status ${p.status}`}>{p.status}</span>
                        </td>
                        <td>
                          {new Date(p.updatedAt).toLocaleDateString("en-AE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                      </tr>
                      {isQuick && (
                        <tr className="fm-quick-edit-row">
                          <td colSpan={6} style={{ padding: 0 }}>
                            <div
                              style={{
                                backgroundColor: '#ffffff',
                                borderTop: '1px solid #e2e8f0',
                                borderBottom: '1px solid #e2e8f0',
                                padding: '24px 28px',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                              }}
                            >
                              {/* Title Heading */}
                              <div
                                style={{
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  letterSpacing: '0.08em',
                                  color: '#64748b',
                                  textTransform: 'uppercase',
                                  marginBottom: '20px'
                                }}
                              >
                                QUICK EDIT
                              </div>

                              {/* 3-Column Layout */}
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'minmax(280px, 1.25fr) minmax(220px, 0.95fr) minmax(260px, 1.1fr)',
                                  gap: '32px',
                                  alignItems: 'start'
                                }}
                              >
                                {/* COLUMN 1: Title, Slug, Date, Author */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                  {/* Title Row */}
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label
                                      style={{
                                        width: '65px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#475569',
                                        flexShrink: 0
                                      }}
                                    >
                                      Title
                                    </label>
                                    <input
                                      type="text"
                                      value={quickTitle}
                                      onChange={(e) => setQuickTitle(e.target.value)}
                                      style={{
                                        flex: 1,
                                        padding: '7px 12px',
                                        fontSize: '13.5px',
                                        color: '#0f172a',
                                        backgroundColor: '#ffffff',
                                        border: '1.5px solid #2563eb',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        boxShadow: '0 0 0 3px rgba(37,99,235,0.12)'
                                      }}
                                    />
                                  </div>

                                  {/* Slug Row */}
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label
                                      style={{
                                        width: '65px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#475569',
                                        flexShrink: 0
                                      }}
                                    >
                                      Slug
                                    </label>
                                    <input
                                      type="text"
                                      value={quickSlug}
                                      onChange={(e) => setQuickSlug(slugify(e.target.value))}
                                      style={{
                                        flex: 1,
                                        padding: '7px 12px',
                                        fontSize: '13px',
                                        color: '#334155',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        outline: 'none'
                                      }}
                                    />
                                  </div>

                                  {/* Date Row */}
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label
                                      style={{
                                        width: '65px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#475569',
                                        flexShrink: 0
                                      }}
                                    >
                                      Date
                                    </label>
                                    <input
                                      type="date"
                                      value={quickDate}
                                      onChange={(e) => setQuickDate(e.target.value)}
                                      style={{
                                        flex: 1,
                                        padding: '7px 12px',
                                        fontSize: '13px',
                                        color: '#334155',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                      }}
                                    />
                                  </div>

                                  {/* Author Row */}
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label
                                      style={{
                                        width: '65px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#475569',
                                        flexShrink: 0
                                      }}
                                    >
                                      Author
                                    </label>
                                    <input
                                      type="text"
                                      value={quickAuthor}
                                      onChange={(e) => setQuickAuthor(e.target.value)}
                                      style={{
                                        flex: 1,
                                        padding: '7px 12px',
                                        fontSize: '13px',
                                        color: '#334155',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        outline: 'none'
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* COLUMN 2: Categories (Scrollable checkbox box) */}
                                <div>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      marginBottom: '10px'
                                    }}
                                  >
                                    Categories
                                  </div>
                                  <div
                                    style={{
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '8px',
                                      padding: '12px 14px',
                                      maxHeight: '175px',
                                      overflowY: 'auto',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '9px',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                    }}
                                  >
                                    {availableCategories.map((catName) => {
                                      const checked = quickCategories.includes(catName);
                                      return (
                                        <label
                                          key={catName}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '9px',
                                            fontSize: '13px',
                                            color: '#1e293b',
                                            cursor: 'pointer',
                                            userSelect: 'none'
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => {
                                              if (checked) {
                                                setQuickCategories(quickCategories.filter((c) => c !== catName));
                                              } else {
                                                setQuickCategories([...quickCategories, catName]);
                                              }
                                            }}
                                            style={{
                                              width: '15px',
                                              height: '15px',
                                              borderRadius: '4px',
                                              border: '1px solid #94a3b8',
                                              cursor: 'pointer',
                                              accentColor: '#2563eb'
                                            }}
                                          />
                                          <span>{catName}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* COLUMN 3: Tags, Allow Comments / Pings, Status */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      marginBottom: '10px'
                                    }}
                                  >
                                    Tags
                                  </div>
                                  <textarea
                                    rows={3}
                                    value={quickTags}
                                    onChange={(e) => setQuickTags(e.target.value)}
                                    placeholder=""
                                    style={{
                                      width: '100%',
                                      minHeight: '80px',
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      color: '#334155',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '8px',
                                      outline: 'none',
                                      resize: 'vertical',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                    }}
                                  />
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: '#64748b',
                                      marginTop: '6px',
                                      marginBottom: '14px'
                                    }}
                                  >
                                    Separate tags with commas
                                  </div>

                                  {/* Checkbox options: Allow Comments & Allow Pings */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '18px',
                                      marginBottom: '16px'
                                    }}
                                  >
                                    <label
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        fontSize: '13px',
                                        color: '#1e293b',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={quickAllowComments}
                                        onChange={(e) => setQuickAllowComments(e.target.checked)}
                                        style={{
                                          width: '15px',
                                          height: '15px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          accentColor: '#2563eb'
                                        }}
                                      />
                                      <span>Allow Comments</span>
                                    </label>

                                    <label
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        fontSize: '13px',
                                        color: '#1e293b',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={quickAllowPings}
                                        onChange={(e) => setQuickAllowPings(e.target.checked)}
                                        style={{
                                          width: '15px',
                                          height: '15px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          accentColor: '#2563eb'
                                        }}
                                      />
                                      <span>Allow Pings</span>
                                    </label>
                                  </div>

                                  {/* Status Dropdown */}
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label
                                      style={{
                                        width: '60px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#475569',
                                        flexShrink: 0
                                      }}
                                    >
                                      Status
                                    </label>
                                    <select
                                      value={quickStatus}
                                      onChange={(e) => setQuickStatus(e.target.value as "draft" | "published")}
                                      style={{
                                        flex: 1,
                                        padding: '7px 12px',
                                        fontSize: '13px',
                                        color: '#1e293b',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <option value="published">Published</option>
                                      <option value="draft">Draft</option>
                                      <option value="pending">Pending Review</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* BOTTOM ACTION BUTTONS: Update & Cancel on the left */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  marginTop: '24px'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => saveQuickEdit(p.id)}
                                  style={{
                                    padding: '8px 24px',
                                    backgroundColor: '#1d6ff2',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(29,111,242,0.2)',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#185ecc')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1d6ff2')}
                                >
                                  Update
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setQuickEditId(null)}
                                  style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#ffffff',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && <div className="tk-empty">No blog posts yet.</div>}
          </div>
        </main>
      </>
    );

  return (
    <div
      className="fm-editor"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        width: "100vw",
        height: "100vh",
        minHeight: "100vh"
      }}
      onClick={() => {
        setTypeMenuOpen(false);
        setAlignMenuOpen(false);
        setMoreMenuOpen(false);
      }}
    >
      <header className="fm-editor-bar">
        <div className="fm-bar-group">
          <button
            type="button"
            className="fm-icon text"
            onClick={() => {
              if (post.title.trim() || blocks.some((b) => b.content.trim()) || history.length > 0) {
                setShowLeaveModal(true);
              } else {
                router.push("/admin/content/blog");
              }
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button className="fm-icon primary" onClick={() => setInserter(!inserter)}>
            <Plus size={16} />
          </button>
          <button className="fm-icon" disabled={!history.length} onClick={undo}>
            <Undo2 size={16} />
          </button>
          <button className="fm-icon" disabled={!future.length} onClick={redo}>
            <Redo2 size={16} />
          </button>
          <button className="fm-icon">
            <ListTree size={16} />
          </button>
        </div>
        <span className="fm-doc-chip">{post.title || "No Title"} - Post</span>
        <div className="fm-bar-group">
          <button className="fm-text-btn" onClick={() => persistPost("draft")}>
            <Save size={15} /> Save draft
          </button>
          <Link
            className="fm-text-btn"
            target="_blank"
            href={`/blog/${post.slug || slugify(post.title) || "preview"}?preview=1`}
          >
            <Eye size={15} /> Preview
          </Link>
          <button className="fm-seo-btn" onClick={openSeoModal}>
            SEO
          </button>
          <button
            className={`fm-icon ${sidebar ? "dark" : ""}`}
            onClick={() => setSidebar(!sidebar)}
          >
            <Settings2 size={16} />
          </button>
          <button className="fm-publish" onClick={() => persistPost("published")}>
            Publish
          </button>
        </div>
      </header>

      {message && <div className="fm-toast">{message}</div>}

      <div className={`fm-editor-body ${sidebar ? "" : "wide"}`}>
        <main className="fm-canvas">
          <input
            className="fm-title"
            value={post.title}
            onChange={(e) =>
              update({ title: e.target.value, slug: post.slug || slugify(e.target.value) })
            }
            placeholder="Add title"
          />

          {!post.showByline ? (
            <button
              className="fm-byline-add"
              onClick={() => update({ showByline: true, showAuthor: true, showReviewer: true })}
            >
              <Plus size={14} /> Add Author &amp; Reviewer Bar
            </button>
          ) : (
            <div className="fm-byline-bar-container">
              <div className="fm-byline-cards">
                {post.showAuthor !== false && (
                  <div className="fm-byline-card">
                    <button
                      type="button"
                      className="fm-byline-card-remove"
                      title="Remove Author"
                      onClick={() => update({ showAuthor: false })}
                    >
                      <X size={10} />
                    </button>
                    <div
                      className="fm-byline-avatar-box"
                      onClick={() => authorImgRef.current?.click()}
                      title="Upload author photo"
                    >
                      {post.authorImage ? (
                        <img src={post.authorImage} alt="Author" className="fm-byline-avatar-img" />
                      ) : (
                        <User size={18} className="fm-byline-avatar-icon" />
                      )}
                      <span className="fm-byline-badge-plus">+</span>
                      <input
                        ref={authorImgRef}
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={upload("authorImage")}
                      />
                    </div>
                    <div className="fm-byline-info">
                      <div className="fm-byline-label">
                        <PenLine size={13} className="fm-byline-pen" />
                        <span>Written By</span>
                      </div>
                      <input
                        className="fm-byline-input"
                        value={post.author || ""}
                        onChange={(e) => update({ author: e.target.value })}
                        placeholder="Author name"
                      />
                    </div>
                  </div>
                )}
                {post.showAuthor !== false && post.showReviewer !== false && (
                  <div className="fm-byline-divider" />
                )}
                {post.showReviewer !== false && (
                  <div className="fm-byline-card">
                    <button
                      type="button"
                      className="fm-byline-card-remove"
                      title="Remove Reviewer"
                      onClick={() => update({ showReviewer: false })}
                    >
                      <X size={10} />
                    </button>
                    <div
                      className="fm-byline-avatar-box"
                      onClick={() => reviewerImgRef.current?.click()}
                      title="Upload reviewer photo"
                    >
                      {post.reviewerImage ? (
                        <img
                          src={post.reviewerImage}
                          alt="Reviewer"
                          className="fm-byline-avatar-img"
                        />
                      ) : (
                        <User size={18} className="fm-byline-avatar-icon" />
                      )}
                      <span className="fm-byline-badge-plus">+</span>
                      <input
                        ref={reviewerImgRef}
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={upload("reviewerImage")}
                      />
                    </div>
                    <div className="fm-byline-info">
                      <div className="fm-byline-label">
                        <span className="fm-byline-check-badge">✓</span>
                        <span>Reviewed by:</span>
                      </div>
                      <input
                        className="fm-byline-input"
                        value={post.reviewer || ""}
                        onChange={(e) => update({ reviewer: e.target.value })}
                        placeholder="Reviewer name"
                      />
                    </div>
                  </div>
                )}
                {post.showAuthor === false && post.showReviewer === false && (
                  <button
                    type="button"
                    className="fm-byline-sub-add"
                    onClick={() => update({ showAuthor: true, showReviewer: true })}
                  >
                    <Plus size={12} /> Restore Cards
                  </button>
                )}
              </div>
              <button
                type="button"
                className="fm-byline-hide-btn"
                onClick={() => update({ showByline: false })}
              >
                <X size={14} /> Hide Bar
              </button>
            </div>
          )}

          {/* Blocks */}
          <div className="fm-blocks">
            {blocks.map((b, i) => {
              const isActive = activeBlockId === b.id;
              return (
                <div
                  className={`fm-block ${isActive ? "active-block" : ""}`}
                  key={b.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBlockId(b.id);
                  }}
                >
                  {/* Floating Gutenberg Toolbar above active block */}
                  {isActive && (
                    <div
                      className="fm-floating-toolbar"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {/* Block Type Dropdown */}
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          className={`fm-toolbar-btn ${typeMenuOpen ? "active" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setTypeMenuOpen(!typeMenuOpen);
                            setAlignMenuOpen(false);
                            setMoreMenuOpen(false);
                          }}
                        >
                          {getBlockTypeMeta(b.type).icon}
                          <span>{getBlockTypeMeta(b.type).label}</span>
                          {typeMenuOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {typeMenuOpen && (
                          <div className="fm-toolbar-dropdown">
                            <button
                              type="button"
                              className={`fm-dropdown-item ${b.type === "paragraph" ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                changeActiveBlockType("paragraph");
                              }}
                            >
                              <AlignLeft size={15} />
                              <span>Paragraph</span>
                            </button>
                            <button
                              type="button"
                              className={`fm-dropdown-item ${b.type === "heading" || b.type === "heading2" ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                changeActiveBlockType("heading2");
                              }}
                            >
                              <b>H2</b>
                              <span>Heading 2</span>
                            </button>
                            <button
                              type="button"
                              className={`fm-dropdown-item ${b.type === "heading3" ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                changeActiveBlockType("heading3");
                              }}
                            >
                              <b>H3</b>
                              <span>Heading 3</span>
                            </button>
                            <button
                              type="button"
                              className={`fm-dropdown-item ${b.type === "heading4" ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                changeActiveBlockType("heading4");
                              }}
                            >
                              <b>H4</b>
                              <span>Heading 4</span>
                            </button>
                            <button
                              type="button"
                              className={`fm-dropdown-item ${b.type === "list" ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                changeActiveBlockType("list");
                              }}
                            >
                              <List size={15} />
                              <span>Bullet List</span>
                            </button>
                            <button
                              type="button"
                              className={`fm-dropdown-item ${b.type === "quote" ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                changeActiveBlockType("quote");
                              }}
                            >
                              <Quote size={15} />
                              <span>Quote</span>
                            </button>
                            <button
                              type="button"
                              className={`fm-dropdown-item ${b.type === "code" ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                changeActiveBlockType("code");
                              }}
                            >
                              <Code size={15} />
                              <span>Code Block</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="fm-toolbar-divider" />

                      {/* Alignment */}
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          className={`fm-toolbar-btn ${alignMenuOpen ? "active" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setAlignMenuOpen(!alignMenuOpen);
                            setTypeMenuOpen(false);
                            setMoreMenuOpen(false);
                          }}
                        >
                          <AlignLeft size={15} />
                          <ChevronDown size={13} />
                        </button>

                        {alignMenuOpen && (
                          <div className="fm-toolbar-dropdown" style={{ minWidth: 140 }}>
                            <button
                              type="button"
                              className="fm-dropdown-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyFormat("justifyLeft");
                                setAlignMenuOpen(false);
                              }}
                            >
                              <AlignLeft size={15} />
                              <span>Align Left</span>
                            </button>
                            <button
                              type="button"
                              className="fm-dropdown-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyFormat("justifyCenter");
                                setAlignMenuOpen(false);
                              }}
                            >
                              <AlignCenter size={15} />
                              <span>Align Center</span>
                            </button>
                            <button
                              type="button"
                              className="fm-dropdown-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyFormat("justifyRight");
                                setAlignMenuOpen(false);
                              }}
                            >
                              <AlignRight size={15} />
                              <span>Align Right</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="fm-toolbar-divider" />

                      {/* Bold */}
                      <button
                        type="button"
                        className="fm-toolbar-btn"
                        title="Bold"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyFormat("bold");
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: 14 }}>B</span>
                      </button>

                      {/* Italic */}
                      <button
                        type="button"
                        className="fm-toolbar-btn"
                        title="Italic"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyFormat("italic");
                        }}
                      >
                        <span
                          style={{
                            fontStyle: "italic",
                            fontFamily: "serif",
                            fontWeight: 600,
                            fontSize: 15
                          }}
                        >
                          I
                        </span>
                      </button>

                      {/* Underline */}
                      <button
                        type="button"
                        className="fm-toolbar-btn"
                        title="Underline"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyFormat("underline");
                        }}
                      >
                        <span
                          style={{
                            textDecoration: "underline",
                            fontWeight: 600,
                            fontSize: 14
                          }}
                        >
                          U
                        </span>
                      </button>

                      <div className="fm-toolbar-divider" />

                      {/* Link */}
                      <button
                        type="button"
                        className="fm-toolbar-btn"
                        title="Link"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyLink();
                        }}
                      >
                        <Link2 size={15} />
                      </button>

                      {/* Highlight */}
                      <button
                        type="button"
                        className="fm-toolbar-btn"
                        title="Highlight"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyHighlight();
                        }}
                      >
                        <Highlighter size={15} color="#e11d48" />
                      </button>

                      <div className="fm-toolbar-divider" />

                      {/* More Options ⋮ */}
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          className={`fm-toolbar-btn ${moreMenuOpen ? "active" : ""}`}
                          title="More formatting"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setMoreMenuOpen(!moreMenuOpen);
                            setTypeMenuOpen(false);
                            setAlignMenuOpen(false);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {moreMenuOpen && (
                          <div className="fm-toolbar-dropdown right">
                            <button
                              type="button"
                              className="fm-dropdown-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyFormat("strikeThrough");
                                setMoreMenuOpen(false);
                              }}
                            >
                              <Strikethrough size={14} />
                              <span>Strikethrough</span>
                            </button>
                            <button
                              type="button"
                              className="fm-dropdown-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyInlineCode();
                                setMoreMenuOpen(false);
                              }}
                            >
                              <Code size={14} />
                              <span>Inline Code</span>
                            </button>
                            <button
                              type="button"
                              className="fm-dropdown-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyFormat("subscript");
                                setMoreMenuOpen(false);
                              }}
                            >
                              <span style={{ fontSize: 13, fontWeight: 700 }}>
                                X<sub style={{ fontSize: 10 }}>2</sub>
                              </span>
                              <span>Subscript</span>
                            </button>
                            <button
                              type="button"
                              className="fm-dropdown-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyFormat("superscript");
                                setMoreMenuOpen(false);
                              }}
                            >
                              <span style={{ fontSize: 13, fontWeight: 700 }}>
                                X<sup style={{ fontSize: 10 }}>2</sup>
                              </span>
                              <span>Superscript</span>
                            </button>
                            <div className="fm-dropdown-sep" />
                            <button
                              type="button"
                              className="fm-dropdown-item danger"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyFormat("removeFormat");
                                setMoreMenuOpen(false);
                              }}
                            >
                              <X size={13} />
                              <span>Clear Formatting</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Left move control */}
                  {isActive && i > 0 && (
                    <button
                      type="button"
                      className="fm-block-left-control"
                      title="Move Up"
                      onClick={(e) => {
                        e.stopPropagation();
                        const n = [...blocks];
                        [n[i - 1], n[i]] = [n[i], n[i - 1]];
                        setBlocks(n);
                      }}
                    >
                      <ChevronUp size={15} />
                    </button>
                  )}

                  {/* Block Editor Content */}
                  {b.type === "image" ? (
                    <input
                      className="fm-block-editable"
                      value={b.content}
                      onChange={(e) =>
                        setBlocks(
                          blocks.map((x) => (x.id === b.id ? { ...x, content: e.target.value } : x))
                        )
                      }
                      placeholder="Paste image URL..."
                    />
                  ) : b.type === "table" ? (
                    <textarea
                      className="fm-block-editable table"
                      value={b.content}
                      onChange={(e) =>
                        setBlocks(
                          blocks.map((x) => (x.id === b.id ? { ...x, content: e.target.value } : x))
                        )
                      }
                      placeholder="Enter table data..."
                    />
                  ) : (
                    <BlockContentEditor
                      block={b}
                      onFocus={() => setActiveBlockId(b.id)}
                      onChange={(content) =>
                        setBlocks(
                          blocks.map((x) => (x.id === b.id ? { ...x, content } : x))
                        )
                      }
                      onEnter={() => {
                        const newB = block("paragraph");
                        const next = [...blocks];
                        next.splice(i + 1, 0, newB);
                        setBlocks(next);
                        setActiveBlockId(newB.id);
                      }}
                    />
                  )}

                  <button
                    type="button"
                    className="fm-block-delete"
                    title="Delete Block"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (blocks.length > 1) {
                        setBlocks(blocks.filter((x) => x.id !== b.id));
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="fm-inline-plus"
                    title="Insert Block"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInserter(true);
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          <button className="fm-add-bottom" onClick={() => setInserter(true)}>
            <Plus size={14} /> Add block
          </button>

          {/* Breadcrumb bottom */}
          <div className="fm-breadcrumb">
            <span>Post</span>
            <span>&gt;</span>
            <span>{activeBlock ? getBlockTypeMeta(activeBlock.type).label : "Paragraph"}</span>
          </div>

          {inserter && <BlockPicker add={addBlock} close={() => setInserter(false)} />}
        </main>

        {sidebar && (
          <aside className="fm-settings">
            <div className="fm-tabs">
              <b>Post</b>
              <span>Block</span>
              <button onClick={() => setSidebar(false)}>
                <X />
              </button>
            </div>
            <Side title="Summary">
              <div className="fm-summary">
                <span>
                  Visibility <b>Public</b>
                </span>
                <span>
                  Publish <b>{post.status === "published" ? "Published" : "Immediately"}</b>
                </span>
              </div>
              <label>
                Author
                <input value={post.author} onChange={(e) => update({ author: e.target.value })} />
              </label>
              <label>
                URL Slug
                <input
                  value={post.slug}
                  onChange={(e) => update({ slug: slugify(e.target.value) })}
                  placeholder="e.g. medical-guide"
                />
              </label>
            </Side>
            <Side title="Author & Reviewer">
              <Check
                label="Show Author & Reviewer Bar"
                checked={!!post.showByline}
                onChange={(v) => update({ showByline: v })}
              />
              <div className="fm-indent">
                <Check
                  label="Show Author"
                  checked={!!post.showAuthor}
                  onChange={(v) => update({ showAuthor: v })}
                />
                <Check
                  label="Show Reviewer"
                  checked={!!post.showReviewer}
                  onChange={(v) => update({ showReviewer: v })}
                />
              </div>
              {post.showReviewer && (
                <>
                  <label>
                    Reviewer
                    <input
                      value={post.reviewer || ""}
                      onChange={(e) => update({ reviewer: e.target.value })}
                    />
                  </label>
                  <label>
                    Reviewer role
                    <input
                      value={post.reviewerRole || ""}
                      onChange={(e) => update({ reviewerRole: e.target.value })}
                    />
                  </label>
                </>
              )}
            </Side>
            <Side title="Categories">
              <div className="fm-category-list">
                {categories.map((c) => (
                  <Check
                    key={c.id}
                    label={c.name}
                    checked={post.category === c.name}
                    onChange={(v) => update({ category: v ? c.name : "" })}
                  />
                ))}
              </div>
              <Link href="/admin/content/blog/categories">+ Add New Category</Link>
            </Side>
            <Side title="Tags">
              <input
                value={post.tags.join(", ")}
                onChange={(e) =>
                  update({
                    tags: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean)
                  })
                }
                placeholder="Add tags separated by commas"
              />
              <div className="fm-tag-row">
                {post.tags.map((t) => (
                  <span key={t}>{t} ×</span>
                ))}
              </div>
            </Side>
            <Side title="Featured Image">
              <button className="fm-image-upload" onClick={() => imageInput.current?.click()}>
                {post.featuredImage ? (
                  <img src={post.featuredImage} alt="Featured" />
                ) : (
                  <>
                    <ImageIcon />
                    <span>Set featured image</span>
                  </>
                )}
              </button>
              <input
                ref={imageInput}
                hidden
                type="file"
                accept="image/*"
                onChange={upload("featuredImage")}
              />
            </Side>
            <Side title="Excerpt">
              <textarea
                rows={4}
                value={post.excerpt}
                onChange={(e) => update({ excerpt: e.target.value })}
                placeholder="Write an excerpt (optional)"
              />
            </Side>
          </aside>
        )}
      </div>


      {/* Unsaved Changes Confirmation Modal */}
      {showLeaveModal && (
        <div className="fm-modal-backdrop" onClick={() => setShowLeaveModal(false)}>
          <div className="fm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="fm-confirm-close"
              onClick={() => setShowLeaveModal(false)}
            >
              <X size={16} />
            </button>

            <div className="fm-confirm-icon-badge">
              <AlertTriangle size={26} />
            </div>

            <h3>Unsaved Changes</h3>
            <p>
              You have unsaved changes. Going back now will discard your unsaved work. Are you sure
              you want to leave without saving?
            </p>

            <div className="fm-confirm-actions">
              <button
                type="button"
                className="fm-confirm-keep-btn"
                onClick={() => setShowLeaveModal(false)}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="fm-confirm-leave-btn"
                onClick={() => router.push("/admin/content/blog")}
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}

      {seo && (
        <div className="fm-modal-backdrop" onClick={() => setSeo(false)}>
          <div className="fm-seo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fm-seo-header">
              <h2>Preview Snippet Editor</h2>
              <button type="button" className="fm-seo-close" onClick={() => setSeo(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Preview Section */}
            <div className="fm-seo-preview-card">
              <h4>Preview</h4>
              <div className="fm-seo-preview-url">
                https://www.gynaeq.com/{draftSeoSlug || "page-url"}
              </div>
              <h3 className="fm-seo-preview-title">
                {draftSeoTitle || post.title || "Page title"}
              </h3>
              <p className="fm-seo-preview-desc">
                {draftSeoDesc || post.excerpt || "Add a concise description for search results."}
              </p>
            </div>

            {/* Title Field Box */}
            <div className="fm-seo-field-box">
              <div className="fm-seo-field-header">
                <span>Title</span>
                <span className="fm-seo-counter">{draftSeoTitle.length} / 60</span>
              </div>
              <input
                className="fm-seo-input"
                value={draftSeoTitle}
                onChange={(e) => setDraftSeoTitle(e.target.value)}
                placeholder="SEO title"
              />
              <p className="fm-seo-field-hint">This appears as the first line in search results.</p>
            </div>

            {/* Permalink Field Box */}
            <div className="fm-seo-field-box">
              <div className="fm-seo-field-header">
                <span>Permalink</span>
                <span className="fm-seo-counter">{draftSeoSlug.length} / 75</span>
              </div>
              <input
                className="fm-seo-input"
                value={draftSeoSlug}
                onChange={(e) => setDraftSeoSlug(slugify(e.target.value))}
                placeholder="page-url"
              />
              <p className="fm-seo-field-hint">The unique URL of this page.</p>
            </div>

            {/* Description Field Box */}
            <div className="fm-seo-field-box">
              <div className="fm-seo-field-header">
                <span>Description</span>
                <span className="fm-seo-counter">{draftSeoDesc.length} / 160</span>
              </div>
              <textarea
                className="fm-seo-textarea"
                rows={3}
                value={draftSeoDesc}
                onChange={(e) => setDraftSeoDesc(e.target.value)}
                placeholder="Meta description"
              />
              <p className="fm-seo-field-hint">This appears below the title in search results.</p>
            </div>

            {/* Checklist */}
            <div className="fm-seo-checks">
              <div
                className={`fm-seo-check-item ${
                  draftSeoTitle.trim().length > 0 && draftSeoTitle.length <= 60 ? "ok" : "warn"
                }`}
              >
                <span>
                  {draftSeoTitle.trim().length > 0 && draftSeoTitle.length <= 60 ? "✓" : "✕"}
                </span>
                <div>SEO title is present and within 60 characters.</div>
              </div>

              <div
                className={`fm-seo-check-item ${
                  draftSeoDesc.trim().length >= 20 && draftSeoDesc.length <= 160 ? "ok" : "warn"
                }`}
              >
                <span>
                  {draftSeoDesc.trim().length >= 20 && draftSeoDesc.length <= 160 ? "✓" : "✕"}
                </span>
                <div>Meta description has a useful search-result length.</div>
              </div>

              <div
                className={`fm-seo-check-item ${
                  draftSeoSlug.trim().length > 0 && draftSeoSlug.length <= 75 ? "ok" : "warn"
                }`}
              >
                <span>
                  {draftSeoSlug.trim().length > 0 && draftSeoSlug.length <= 75 ? "✓" : "✕"}
                </span>
                <div>URL is concise and readable.</div>
              </div>

              <div className="fm-seo-check-item ok">
                <span>✓</span>
                <div>Add a focus keyword for additional checks.</div>
              </div>
            </div>

            {/* Footer */}
            <div className="fm-seo-footer">
              <button
                type="button"
                className="fm-seo-cancel-btn"
                onClick={() => setSeo(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fm-seo-apply-btn"
                onClick={() => {
                  update({
                    seoTitle: draftSeoTitle,
                    slug: draftSeoSlug,
                    seoDescription: draftSeoDesc
                  });
                  setSeo(false);
                }}
              >
                Apply SEO changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockContentEditor({
  block,
  onFocus,
  onChange,
  onEnter
}: {
  block: Block;
  onFocus: () => void;
  onChange: (html: string) => void;
  onEnter: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== block.content && document.activeElement !== ref.current) {
      ref.current.innerHTML = block.content;
    }
  }, [block.content]);

  return (
    <div
      id={`fm-block-content-${block.id}`}
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`fm-block-editable ${block.type}`}
      data-placeholder={
        block.type.startsWith("heading")
          ? "Heading"
          : block.type === "quote"
          ? "Write a quote..."
          : block.type === "list"
          ? "List item..."
          : block.type === "code"
          ? "Write code..."
          : "Type / to choose a block"
      }
      onFocus={onFocus}
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && block.type !== "code") {
          e.preventDefault();
          onEnter();
        }
      }}
    />
  );
}

function BlockPicker({
  add,
  close
}: {
  add: (t: BlockType) => void;
  close: () => void;
}) {
  const choices: [BlockType, React.ReactNode, string][] = [
    ["paragraph", <Type key="p" />, "Paragraph"],
    ["heading2", <Heading2 key="h2" />, "Heading 2"],
    ["heading3", <Heading2 key="h3" />, "Heading 3"],
    ["list", <List key="l" />, "List"],
    ["image", <ImageIcon key="i" />, "Image"],
    ["quote", <Quote key="q" />, "Quote"],
    ["code", <Code key="c" />, "Code Block"],
    ["table", <Table2 key="t" />, "Table"]
  ];
  return (
    <div className="fm-picker">
      <button className="fm-picker-x" onClick={close}>
        <X />
      </button>
      <label>
        <Search />
        <input autoFocus placeholder="Search for a block" />
      </label>
      <div>
        {choices.map(([type, icon, name]) => (
          <button key={type} onClick={() => add(type)}>
            {icon}
            <span>{name}</span>
          </button>
        ))}
      </div>
      <b>Browse all⌄</b>
    </div>
  );
}

function Side({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="fm-side-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Check({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="fm-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function AdminTitle({ title, action }: { title: string; action: React.ReactNode }) {
  return (
    <div className="tk-page-heading">
      <div>
        <h1>{title}</h1>
        <p>Create and manage GYNAEQ healthcare content.</p>
      </div>
      {action}
    </div>
  );
}
