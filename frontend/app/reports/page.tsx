'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Trash2, FileText, File, FileSpreadsheet, FileImage, FolderPlus, Folder, Loader2, X, Search, ChevronRight, Eye } from 'lucide-react';
import Card from '@/components/ui/card';
import Modal from '@/components/ui/modal';
import Badge from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useUI, useRegion } from '@/lib/context';
import type { FileEntry, FileStructure } from '@/lib/types';

const CATEGORIES = ['All', 'Finance', 'HR', 'Sales', 'Marketing', 'Legal', 'Operations', 'General'];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType, className = 'w-5 h-5' }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <FileImage className={`${className} text-blue-500`} />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return <FileSpreadsheet className={`${className} text-green-500`} />;
  if (mimeType.includes('pdf')) return <FileText className={`${className} text-red-500`} />;
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText className={`${className} text-blue-600`} />;
  return <File className={`${className} text-muted-foreground`} />;
}

// ─── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ path, onNavigate }: { path: string[]; onNavigate: (folder: string) => void }) {
  const crumbs = path.map((_, i) => ({ label: i === 0 ? 'Reports' : path[i], fullPath: '/' + path.slice(1, i + 1).join('/') }));
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
      {crumbs.map((cr, i) => (
        <React.Fragment key={cr.fullPath}>
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
          <button
            onClick={() => onNavigate(cr.fullPath)}
            className={`hover:text-foreground transition-colors px-1 py-0.5 rounded ${i === crumbs.length - 1 ? 'text-foreground font-medium' : ''}`}
          >
            {cr.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── File Preview Modal ────────────────────────────────────────────────────────
function FilePreviewModal({ file, isOpen, onClose, onDownload, onDelete }: {
  file: FileEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (f: FileEntry) => void;
  onDelete: (id: string) => void;
}) {
  const { formatDateTime } = useRegion();
  if (!file) return null;
  const isImage = file.mimeType.startsWith('image/');
  const isText = file.mimeType.startsWith('text/') || file.mimeType === 'application/json';
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Details" size="lg">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <FileIcon mimeType={file.mimeType} className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{file.originalName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
          </div>
        </div>

        {isImage && (
          <div className="rounded-lg overflow-hidden border border-border bg-muted/20">
            <img
              src={`${API_URL}/files/${file.id}/download`}
              alt={file.originalName}
              className="max-h-80 mx-auto object-contain"
            />
          </div>
        )}

        {isText && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 max-h-60 overflow-y-auto">
            <p className="text-xs text-muted-foreground italic">Preview available after download</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Size', value: formatSize(file.size) },
            { label: 'Type', value: file.mimeType },
            { label: 'Uploaded by', value: file.uploadedBy?.name || '—' },
            { label: 'Folder', value: file.folder === '/' ? 'Root' : file.folder },
            { label: 'Created', value: formatDateTime(file.createdAt) },
            { label: 'Modified', value: formatDateTime(file.updatedAt) },
          ].map(r => (
            <div key={r.label}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{r.label}</p>
              <p className="text-sm text-foreground font-medium">{r.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => onDownload(file)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" /> Download
          </button>
          <button onClick={() => onDelete(file.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Reports Page ──────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { addToast } = useUI();
  const { formatDateTime } = useRegion();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folders, setFolders] = useState<string[]>(['/']);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await apiFetch('/files/all') as FileStructure;
      setFiles(data.files || []);
      const allFolders = data.folders || [];
      if (!allFolders.includes('/')) allFolders.unshift('/');
      setFolders(allFolders);
    } catch {
      addToast({ type: 'error', message: 'Failed to load files' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // Breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const parts = currentFolder.split('/').filter(Boolean);
    return ['', ...parts];
  }, [currentFolder]);

  // Folder subfolders for the current path
  const subfolders = useMemo(() => {
    const cat = activeCategory.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    return folders.filter(f => {
      if (f === currentFolder || f === '/') return false;
      const parent = f.substring(0, f.lastIndexOf('/')) || '/';
      const folderName = f.split('/').pop()?.toLowerCase() || '';
      if (activeCategory !== 'All' && !folderName.includes(cat)) return false;
      if (q && !folderName.includes(q)) return false;
      if (activeCategory === 'All') return parent === currentFolder;
      return true;
    });
  }, [folders, currentFolder, activeCategory, searchQuery]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    const cat = activeCategory.toLowerCase();
    let list = files.filter(f => f.mimeType !== 'inode/directory');
    if (activeCategory === 'All') {
      list = list.filter(f => f.folder === currentFolder);
    }
    if (activeCategory !== 'All') {
      list = list.filter(f => f.originalName.toLowerCase().includes(cat));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.originalName.toLowerCase().includes(q) ||
        f.mimeType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [files, currentFolder, activeCategory, searchQuery]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setIsUploading(true);
    const targetFolder = currentFolder;
    let uploaded = 0;
    let lastError: string | null = null;
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const token = localStorage.getItem('auth_token');

      for (let i = 0; i < fileList.length; i++) {
        const formData = new FormData();
        formData.append('file', fileList[i]);
        formData.append('folder', targetFolder);
        const res = await fetch(`${API_URL}/files/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Upload failed' }));
          lastError = err.message;
        } else {
          uploaded++;
        }
      }
      if (uploaded > 0) {
        addToast({ type: 'success', message: `Uploaded ${uploaded} file(s) to ${targetFolder === '/' ? 'Root' : targetFolder}` });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchFiles();
      }
      if (lastError) addToast({ type: 'error', message: lastError });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: FileEntry) => {
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Download failed' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/files/${deleteId}`, { method: 'DELETE' });
      addToast({ type: 'success', message: 'File deleted' });
      setDeleteId(null);
      fetchFiles();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Delete failed' });
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim().replace(/\\/g, '/');
    if (!name) return;
    try {
      await apiFetch('/files/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parent: currentFolder }),
      });
      setNewFolderModal(false);
      setNewFolderName('');
      addToast({ type: 'success', message: `Folder "${name}" created` });
      fetchFiles();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to create folder' });
    }
  };

  const navigateFolder = (folder: string) => {
    setCurrentFolder(folder);
    setSearchQuery('');
  };

  const inp = 'w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors';

  return (
    <motion.div className="p-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Files</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your organization&apos;s documents and reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <input ref={fileInputRef} type="file" multiple onChange={e => handleUpload(e.target.files)} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Files
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb path={breadcrumbPath} onNavigate={navigateFolder} />

      {/* Category Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Subfolder cards */}
      {subfolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {subfolders.map(sf => {
            const folderName = sf.split('/').pop() || sf;
            const fileCount = files.filter(f => f.folder === sf && f.mimeType !== 'inode/directory').length;
            return (
              <button
                key={sf}
                onClick={() => navigateFolder(sf)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-accent/5 transition-all group"
              >
                <Folder className="w-10 h-10 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground text-center truncate w-full">{folderName}</span>
                <span className="text-xs text-muted-foreground">{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Current folder indicator */}
      {currentFolder !== '/' && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
          <Folder className="w-4 h-4 text-amber-500" />
          Uploading to: <span className="font-medium text-foreground">{currentFolder}</span>
        </div>
      )}

      {/* Files List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredFiles.length === 0 && subfolders.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No files in this folder</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Upload your first file to get started</p>
        </Card>
      ) : filteredFiles.length > 0 ? (
        <div className="space-y-1">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-4 px-4 py-3 rounded-lg bg-card border border-border hover:bg-muted/20 transition-colors group cursor-pointer"
              onClick={() => setPreviewFile(file)}
            >
              <FileIcon mimeType={file.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} &middot; {file.uploadedBy?.name} &middot; {formatDateTime(file.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); setPreviewFile(file); }}
                  className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDownload(file); }}
                  className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteId(file.id); }}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
        onDelete={(id) => { setPreviewFile(null); setDeleteId(id); }}
      />

      {/* New Folder Modal */}
      <Modal isOpen={newFolderModal} onClose={() => setNewFolderModal(false)} title="Create Folder" size="sm">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folder Name</label>
            <input
              className={inp}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="e.g. Financial Reports"
              autoFocus
              maxLength={100}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setNewFolderModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
            <button onClick={handleCreateFolder} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Create</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete File" size="sm">
        <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this file? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
          <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors">Delete</button>
        </div>
      </Modal>
    </motion.div>
  );
}