import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/lib/backup';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'manual', description } = body;

    const filename = await BackupService.createBackup(user.id, type, description);

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      filename
    });

  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupHistory = await BackupService.getBackupHistory();

    return NextResponse.json({
      success: true,
      data: backupHistory
    });

  } catch (error) {
    console.error('Get backup history error:', error);
    return NextResponse.json(
      { error: 'Failed to get backup history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const deleted = await BackupService.deleteBackup(filename);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Backup not found or already deleted' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}