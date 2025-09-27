// File Upload Service for Production
// Handles resume uploads, document validation, and cloud storage

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileInfo?: {
    size: number;
    type: string;
    extension: string;
  };
}

export class FileUploadService {
  private static readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  private static readonly MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB
  private static readonly ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
  private static readonly ALLOWED_MIMETYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  /**
   * Initialize upload directory
   */
  static async initialize(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
      console.log(`Created upload directory: ${this.UPLOAD_DIR}`);
    }
  }

  /**
   * Validate uploaded file
   */
  static validateFile(file: File): FileValidationResult {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB`
      };
    }

    // Check file type
    if (!this.ALLOWED_MIMETYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.'
      };
    }

    // Check file extension
    const extension = path.extname(file.name).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file extension. Allowed extensions: ' + this.ALLOWED_EXTENSIONS.join(', ')
      };
    }

    return {
      valid: true,
      fileInfo: {
        size: file.size,
        type: file.type,
        extension
      }
    };
  }

  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalName: string, userId: number): string {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    return `user_${userId}_${timestamp}_${randomHash}${extension}`;
  }

  /**
   * Save file to local storage (development)
   */
  static async saveFileLocally(
    file: File, 
    userId: number, 
    category: 'resume' | 'document' = 'resume'
  ): Promise<UploadedFile> {
    await this.initialize();

    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const secureFilename = this.generateSecureFilename(file.name, userId);
    const categoryDir = path.join(this.UPLOAD_DIR, category);
    
    // Create category directory if it doesn't exist
    try {
      await fs.access(categoryDir);
    } catch {
      await fs.mkdir(categoryDir, { recursive: true });
    }

    const filePath = path.join(categoryDir, secureFilename);

    // Convert File to Buffer for Node.js
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file
    await fs.writeFile(filePath, buffer);

    return {
      filename: secureFilename,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      url: `/uploads/${category}/${secureFilename}`,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Upload to cloud storage (production)
   */
  static async uploadToCloud(
    file: File,
    userId: number,
    category: 'resume' | 'document' = 'resume'
  ): Promise<UploadedFile> {
    // This would integrate with AWS S3, Google Cloud Storage, or similar
    // For now, fall back to local storage
    return this.saveFileLocally(file, userId, category);
  }

  /**
   * Delete file
   */
  static async deleteFile(filename: string, category: 'resume' | 'document' = 'resume'): Promise<void> {
    try {
      const filePath = path.join(this.UPLOAD_DIR, category, filename);
      await fs.unlink(filePath);
      console.log(`Deleted file: ${filename}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(filename: string, category: 'resume' | 'document' = 'resume'): Promise<{
    exists: boolean;
    size?: number;
    modifiedAt?: string;
  }> {
    try {
      const filePath = path.join(this.UPLOAD_DIR, category, filename);
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString()
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Scan file for viruses (production feature)
   */
  static async scanFile(filePath: string): Promise<{ safe: boolean; threat?: string }> {
    // In production, integrate with ClamAV or similar antivirus
    // For now, return safe
    return { safe: true };
  }

  /**
   * Extract text from document (for indexing/search)
   */
  static async extractText(file: File): Promise<string> {
    // This would use libraries like pdf-parse, mammoth for docx, etc.
    // For now, return placeholder
    return `Extracted text from ${file.name}`;
  }

  /**
   * Generate file thumbnail (for PDFs)
   */
  static async generateThumbnail(filePath: string): Promise<string> {
    // This would use libraries like pdf2pic
    // For now, return placeholder
    return '/thumbnails/default-document.png';
  }

  /**
   * Cleanup old files (maintenance)
   */
  static async cleanupOldFiles(olderThanDays: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const categories = ['resume', 'document'];
      
      for (const category of categories) {
        const categoryDir = path.join(this.UPLOAD_DIR, category);
        
        try {
          const files = await fs.readdir(categoryDir);
          
          for (const file of files) {
            const filePath = path.join(categoryDir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              console.log(`Cleaned up old file: ${file}`);
            }
          }
        } catch (error) {
          console.error(`Error cleaning up category ${category}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  }
}

// File type detection utilities
export const FileTypeUtils = {
  /**
   * Detect file type from buffer
   */
  detectMimeType(buffer: Buffer): string {
    // PDF
    if (buffer.slice(0, 4).toString() === '%PDF') {
      return 'application/pdf';
    }
    
    // DOC (MS Word 97-2003)
    if (buffer.slice(0, 8).toString('hex') === 'd0cf11e0a1b11ae1') {
      return 'application/msword';
    }
    
    // DOCX (MS Word 2007+)
    if (buffer.slice(0, 2).toString('hex') === '504b') {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    return 'application/octet-stream';
  },

  /**
   * Check if file is safe based on content
   */
  isFileSafe(buffer: Buffer): boolean {
    // Check for common malicious patterns
    const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
    
    const maliciousPatterns = [
      '<script',
      'javascript:',
      'data:text/html',
      'vbscript:',
      '<?php'
    ];
    
    return !maliciousPatterns.some(pattern => 
      content.toLowerCase().includes(pattern.toLowerCase())
    );
  }
};