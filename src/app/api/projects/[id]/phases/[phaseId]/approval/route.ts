import { NextResponse } from 'next/server';
import { 
  getProjectPhaseById,
  getPhaseApproval,
  createPhaseApproval,
  getApprovalFiles,
  createApprovalFile,
  calculatePhaseCosts,
  createNotification,
  getUserById,
  APPROVAL_FILES_BUCKET,
} from '@/lib/luma-docs';
import { luma } from '@/lib/luma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { id: projectId, phaseId } = await params;
    const phaseIdFull = `${projectId}_${phaseId}`;
    
    const phase = await getProjectPhaseById(phaseIdFull);
    if (!phase) {
      return NextResponse.json({ error: 'Phase not found', success: false }, { status: 404 });
    }
    
    const approval = await getPhaseApproval(phaseIdFull);
    const approvalFiles = approval ? await getApprovalFiles(approval.id) : [];
    
    return NextResponse.json({
      data: {
        phase,
        approval,
        approvalFiles,
      },
      success: true,
    });
  } catch (error) {
    console.error('Error fetching phase approval:', error);
    return NextResponse.json({ error: 'Failed to fetch phase approval', success: false }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { id: projectId, phaseId } = await params;
    const phaseIdFull = `${projectId}_${phaseId}`;
    const body = await request.json();
    
    const { 
      approvedBy, 
      callDate, 
      callTime, 
      callPerson, 
      callNotes, 
      notes, 
      files 
    } = body;
    
    const phase = await getProjectPhaseById(phaseIdFull);
    if (!phase) {
      return NextResponse.json({ error: 'Phase not found', success: false }, { status: 404 });
    }
    
    const approvalId = `approval_${Date.now()}`;
    const approval = await createPhaseApproval({
      id: approvalId,
      projectPhaseId: phaseIdFull,
      approvedAt: new Date().toISOString(),
      approvedBy,
      callDate,
      callTime,
      callPerson,
      callNotes,
      notes,
    });
    
    if (files && files.length > 0) {
      for (const file of files) {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        // Los bytes van al blob store (S3-like), no embebidos en el documento.
        let blobKey: string | undefined;
        if (typeof file.data === 'string' && file.data.length > 0) {
          await luma.putBlob(APPROVAL_FILES_BUCKET, fileId, Buffer.from(file.data, 'base64'));
          blobKey = fileId;
        }
        await createApprovalFile({
          id: fileId,
          phaseApprovalId: approvalId,
          name: file.name,
          type: file.type,
          size: file.size,
          blobKey,
          uploadedBy: approvedBy,
        });
      }
    }
    
    await calculatePhaseCosts(projectId, phaseId);
    
    const approver = await getUserById(approvedBy);
    if (approver) {
      await createNotification({
        id: `notif_${Date.now()}`,
        userId: approvedBy,
        type: 'phase_approved',
        title: `Fase "${phase.name}" aprobada`,
        message: `La fase "${phase.name}" del proyecto ha sido marcada como completada.`,
        projectId,
        phaseId,
        read: false,
      });
    }
    
    const approvalFiles = await getApprovalFiles(approvalId);
    
    return NextResponse.json({
      data: {
        approval,
        approvalFiles,
      },
      success: true,
    });
  } catch (error) {
    console.error('Error creating phase approval:', error);
    return NextResponse.json({ error: 'Failed to create phase approval', success: false }, { status: 500 });
  }
}