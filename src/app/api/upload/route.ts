import { NextRequest } from 'next/server';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';
import { FileUploadService } from '@/lib/file-upload';

/**
 * POST /api/upload
 * Handle file uploads (resumes, documents)
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const formData = await req.formData();
    
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'resume';
    
    if (!file) {
      return ApiResponse.error('No file provided', 400);
    }
    
    // Validate category
    if (!['resume', 'document'].includes(category)) {
      return ApiResponse.error('Invalid category. Must be "resume" or "document"', 400);
    }
    
    // Only students and staff can upload files
    if (!['STUDENT', 'STAFF'].includes(user.role)) {
      return ApiResponse.forbidden('Only students and staff can upload files');
    }
    
    // Validate file
    const validation = FileUploadService.validateFile(file);
    if (!validation.valid) {
      return ApiResponse.error(validation.error!, 400);
    }
    
    // Upload file
    const uploadedFile = await FileUploadService.saveFileLocally(file, user.id, category as 'resume' | 'document');
    
    // In production, you would also:
    // 1. Scan for viruses
    // 2. Update user profile with file reference
    // 3. Generate thumbnail for PDFs
    // 4. Extract text for search indexing
    
    return ApiResponse.success({
      file: uploadedFile,
      message: `${category.charAt(0).toUpperCase() + category.slice(1)} uploaded successfully`
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    return ApiResponse.serverError('Failed to upload file');
  }
}, ['STUDENT', 'STAFF']);

/**
 * DELETE /api/upload
 * Delete uploaded file
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');
    const category = searchParams.get('category') || 'resume';
    
    if (!filename) {
      return ApiResponse.error('Filename is required', 400);
    }
    
    // Security check - ensure user owns the file or is staff
    if (user.role !== 'STAFF' && !filename.includes(`user_${user.id}_`)) {
      return ApiResponse.forbidden('You can only delete your own files');
    }
    
    await FileUploadService.deleteFile(filename, category as 'resume' | 'document');
    
    return ApiResponse.success({
      message: 'File deleted successfully'
    });
    
  } catch (error) {
    console.error('File deletion error:', error);
    return ApiResponse.serverError('Failed to delete file');
  }
}, ['STUDENT', 'STAFF']);