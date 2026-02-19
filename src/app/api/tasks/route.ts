import { NextResponse } from 'next/server';
import { 
  getTasks, 
  getAllTasksFlat, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask,
  getProjects,
  getUsers,
  type TaskDoc 
} from '@/lib/luma-docs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assigneeId = searchParams.get('assigneeId');
    const parentId = searchParams.get('parentId');
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true';
    const id = searchParams.get('id');
    
    // Get projects and users for enrichment
    const [projects, users] = await Promise.all([getProjects(), getUsers()]);
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Get single task
    if (id) {
      const task = await getTaskById(id);
      if (!task) {
        return NextResponse.json({ error: 'Task not found', success: false }, { status: 404 });
      }
      const enriched = {
        ...task,
        project: task.projectId ? { name: projectMap.get(task.projectId)?.name || '' } : undefined,
        assignee: task.assigneeId ? { name: userMap.get(task.assigneeId)?.name || '' } : undefined,
      };
      return NextResponse.json({ data: enriched, success: true });
    }
    
    // Get tasks with filter
    const filter: { projectId?: string; assigneeId?: string; parentId?: string | null } = {};
    if (projectId) filter.projectId = projectId;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (parentId !== null) {
      filter.parentId = parentId === 'null' ? null : parentId;
    }
    
    let tasks: TaskDoc[];
    if (includeHierarchy || Object.keys(filter).length === 0) {
      tasks = await getTasks(filter.parentId !== undefined ? filter : undefined);
    } else {
      tasks = await getAllTasksFlat();
      if (projectId) tasks = tasks.filter(t => t.projectId === projectId);
      if (assigneeId) tasks = tasks.filter(t => t.assigneeId === assigneeId);
    }
    
    // Enrich with project and user info
    const enrichedTasks = tasks.map(t => ({
      ...t,
      project: t.projectId ? { name: projectMap.get(t.projectId)?.name || '' } : undefined,
      assignee: t.assigneeId ? { name: userMap.get(t.assigneeId)?.name || '' } : undefined,
    }));
    
    return NextResponse.json({ data: enrichedTasks, success: true });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks', success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      projectId, 
      parentId, 
      name, 
      description, 
      assigneeId, 
      startDate, 
      endDate, 
      estimatedHours = 0,
      priority = 'medium',
      status = 'todo',
      dependencies = [],
      isEpic = false,
      isMilestone = false,
    } = body;
    
    const id = `task_${Date.now()}`;
    
    const task = await createTask({
      id,
      projectId,
      parentId: parentId || undefined,
      name,
      description,
      assigneeId: assigneeId || undefined,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      estimatedHours,
      actualHours: 0,
      progress: 0,
      priority,
      status,
      dependencies,
      isEpic,
      isMilestone,
    });
    
    return NextResponse.json({ data: task, success: true });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', success: false },
        { status: 400 }
      );
    }
    
    const task = await updateTask(id, updates);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found', success: false },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: task, success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', success: false },
        { status: 400 }
      );
    }
    
    await deleteTask(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task', success: false },
      { status: 500 }
    );
  }
}