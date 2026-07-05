'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Trash2, FileText, File, FileSpreadsheet, FileImage, FolderPlus, Loader2, X } from 'lucide-react';
import Card from '@/components/ui/card';
import Modal from '@/components/ui/modal';
import { apiFetch } from '@/lib/api';
import { useUI } from '@/lib/context';
import type { FileEntry, FileStructure } from '@/lib/types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

export default function ReportsPage() {
  const { addToast } = useUI();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folders, setFolders] = useState<string[]>(['/']);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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

  const filteredFiles = currentFolder === '/'
    ? files
    : files.filter(f => f.folder === currentFolder);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setIsUploading(true);
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const token = localStorage.getItem('auth_token');

      for (let i = 0; i < fileList.length; i++) {
        const formData = new FormData();
        formData.append('file', fileList[i]);
        formData.append('folder', currentFolder);

        const res = await fetch(`${API_URL}/files/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(err.message);
        }
      }
      addToast({ type: 'success', message: `Uploaded ${fileList.length} file(s)` });
      fetchFiles();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
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
    const folderPath = currentFolder === '/' ? `/${name}` : `${currentFolder}/${name}`;
    setFolders(prev => prev.includes(folderPath) ? prev : [...prev, folderPath].sort());
    setNewFolderModal(false);
    setNewFolderName('');
    addToast({ type: 'success', message: `Folder "${name}" created` });
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={e => handleUpload(e.target.files)}
            className="hidden"
          />
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

      {/* Folder Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {folders.map(folder => (
          <button
            key={folder}
            onClick={() => setCurrentFolder(folder)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentFolder === folder
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
            }`}
          >
            {folder === '/' ? 'All Files' : folder.replace(/^\//, '').replace(/\//g, ' / ')}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-muted-foreground/30'
        }`}
      >
        <Upload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {dragOver ? 'Drop files here' : 'Drag & drop files here, or click the Upload button'}
        </p>
        <p className="text-xs text-muted-foreground/50 mt-1">PDF, Word, Excel, Images, and more</p>
      </div>

      {/* Files Grid/List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No files in this folder</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Upload your first file to get started</p>
        </Card>
      ) : (
        <div className="space-y-1">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-4 px-4 py-3 rounded-lg bg-card border border-border hover:bg-muted/20 transition-colors group"
            >
              <FileIcon mimeType={file.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} &middot; {file.uploadedBy?.name} &middot; {formatDate(file.createdAt)}
                  {file.folder !== '/' && file.folder !== currentFolder && (
                    <> &middot; <span className="text-primary">{file.folder}</span></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(file.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
