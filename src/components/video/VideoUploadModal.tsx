'use client';

import { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { extractVideoMetadata } from '@/lib/videoService';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  onUploadComplete: (videoData: any) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];

export default function VideoUploadModal({
  isOpen,
  onClose,
  communityId,
  onUploadComplete,
}: VideoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Invalid file type. Please upload MP4, MOV, AVI, MKV, or WebM files.');
      setUploadStatus('error');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('File size exceeds 2GB limit. Please compress your video and try again.');
      setUploadStatus('error');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setUploadStatus('idle');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Extract video metadata
      const metadata = await extractVideoMetadata(selectedFile);

      // Create Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFilename = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${communityId}/${user.id}/${timestamp}_${sanitizedFilename}`;

      // Upload to Supabase Storage with progress tracking
      const { data, error } = await supabase.storage
        .from('community-videos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      setUploadProgress(100);
      setUploadStatus('processing');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('community-videos')
        .getPublicUrl(data.path);

      // Pass data to parent component for details form
      onUploadComplete({
        storage_path: data.path,
        content_url: urlData.publicUrl,
        metadata: {
          ...metadata,
          original_filename: selectedFile.name,
        },
      });

      setUploadStatus('success');
      
      // Auto-close after 1 second
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || 'Upload failed. Please try again.');
      setUploadStatus('error');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Upload Video
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            disabled={uploadStatus === 'uploading'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedFile ? (
            // Upload Zone
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center transition-all
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                }
              `}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Drag & drop your video here
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                or click to browse your files
              </p>
              <button
                onClick={handleBrowseClick}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Select File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Supported formats: MP4, MOV, AVI, MKV, WebM</p>
                <p>Maximum file size: 2GB</p>
              </div>
            </div>
          ) : (
            // File Selected / Upload Progress
            <div className="space-y-6">
              {/* File Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  {uploadStatus === 'idle' && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-500 hover:text-red-600 transition-colors ml-4"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          uploadStatus === 'uploading' ? 'bg-blue-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success State */}
                {uploadStatus === 'success' && (
                  <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Upload complete!</span>
                  </div>
                )}

                {/* Error State */}
                {uploadStatus === 'error' && errorMessage && (
                  <div className="mt-4 flex items-start gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleClose}
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                {uploadStatus === 'idle' && (
                  <button
                    onClick={handleUpload}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Video
                  </button>
                )}
                {uploadStatus === 'uploading' && (
                  <button
                    disabled
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 opacity-75 cursor-not-allowed"
                  >
                    <Loader className="h-4 w-4 animate-spin" />
                    Uploading...
                  </button>
                )}
                {uploadStatus === 'error' && (
                  <button
                    onClick={handleUpload}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Retry Upload
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

