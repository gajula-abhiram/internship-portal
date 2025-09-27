import { NextRequest } from 'next/server';
import { withAuth, ApiResponse, validateRequiredFields, AuthenticatedRequest } from '@/lib/middleware';
import { ReportGenerator, ReportConfig } from '@/lib/report-generator';

/**
 * GET /api/reports/templates
 * Get available report templates
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    
    // Only staff can access reports
    if (user.role !== 'STAFF') {
      return ApiResponse.forbidden('Only staff can access reports');
    }
    
    const templates = ReportGenerator.getReportTemplates();
    
    return ApiResponse.success({
      templates,
      message: 'Report templates retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get report templates error:', error);
    return ApiResponse.serverError('Failed to get report templates');
  }
}, ['STAFF']);

/**
 * POST /api/reports/generate
 * Generate a report
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const body = await req.json();
    
    // Only staff can generate reports
    if (user.role !== 'STAFF') {
      return ApiResponse.forbidden('Only staff can generate reports');
    }
    
    const { type, format, dateRange, filters, includePersonalData } = body;
    
    // Validate required fields
    const validationError = validateRequiredFields(body, ['type', 'format', 'dateRange']);
    if (validationError) {
      return ApiResponse.error(validationError, 400);
    }
    
    // Validate report type
    const validTypes = ['PLACEMENT_STATISTICS', 'STUDENT_PROGRESS', 'COMPANY_ENGAGEMENT', 'CUSTOM'];
    if (!validTypes.includes(type)) {
      return ApiResponse.error('Invalid report type', 400);
    }
    
    // Validate format
    const validFormats = ['EXCEL', 'PDF', 'CSV'];
    if (!validFormats.includes(format)) {
      return ApiResponse.error('Invalid report format', 400);
    }
    
    // Validate date range
    if (!dateRange.start || !dateRange.end) {
      return ApiResponse.error('Date range start and end are required', 400);
    }
    
    const config: ReportConfig = {
      type,
      format,
      dateRange,
      filters,
      includePersonalData: includePersonalData || false
    };
    
    let result;
    
    switch (type) {
      case 'PLACEMENT_STATISTICS':
        result = await ReportGenerator.generatePlacementReport(config);
        break;
      case 'STUDENT_PROGRESS':
        result = await ReportGenerator.generateStudentProgressReport(config);
        break;
      case 'COMPANY_ENGAGEMENT':
        result = await ReportGenerator.generateCompanyEngagementReport(config);
        break;
      default:
        return ApiResponse.error('Report type not implemented yet', 400);
    }
    
    if (!result.success) {
      return ApiResponse.error(result.error || 'Report generation failed', 500);
    }
    
    return ApiResponse.success({
      report: result,
      message: 'Report generated successfully'
    });
    
  } catch (error) {
    console.error('Generate report error:', error);
    return ApiResponse.serverError('Failed to generate report');
  }
}, ['STAFF']);