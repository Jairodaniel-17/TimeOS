import { NextResponse } from 'next/server';
import { getProjects, getClients, createClient, getClientById } from '@/lib/luma-docs';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  projects: ProjectInfo[];
  totalBudget: number;
  totalHours: number;
  activeProjects: number;
  completedProjects: number;
}

interface ProjectInfo {
  id: string;
  name: string;
  code: string;
  status: string;
  budget: number;
  budgetHours: number;
  progress: number;
}

export async function GET() {
  try {
    const projects = await getProjects();
    const storedClients = await getClients();
    
    const clientMap = new Map<string, ProjectInfo[]>();
    
    for (const project of projects) {
      const clientName = project.client || 'Sin cliente';
      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, []);
      }
      clientMap.get(clientName)!.push({
        id: project.id,
        name: project.name,
        code: project.code || '',
        status: project.status || 'active',
        budget: project.budget || 0,
        budgetHours: project.budgetHours || 0,
        progress: project.progress || 0,
      });
    }

    const clients: Client[] = Array.from(clientMap.entries()).map(([name, projectList]) => {
      const activeProjects = projectList.filter(p => p.status === 'active').length;
      const completedProjects = projectList.filter(p => p.status === 'completed').length;
      
      const storedClient = storedClients.find(c => c.name === name);
      
      return {
        id: storedClient?.id || `client_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name,
        email: storedClient?.email,
        phone: storedClient?.phone,
        projects: projectList,
        totalBudget: projectList.reduce((sum, p) => sum + p.budget, 0),
        totalHours: projectList.reduce((sum, p) => sum + p.budgetHours, 0),
        activeProjects,
        completedProjects,
      };
    });

    clients.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ data: clients, success: true });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, contact } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Client name is required', success: false },
        { status: 400 }
      );
    }

    const existingClients = await getClients();
    const existingClient = existingClients.find(c => c.name.toLowerCase() === name.toLowerCase());
    
    if (existingClient) {
      return NextResponse.json(
        { error: 'Client already exists', success: false },
        { status: 409 }
      );
    }

    const client = await createClient({
      id: `client_${Date.now()}`,
      name,
      email,
      phone,
      contact,
    });
    
    return NextResponse.json({ 
      data: client, 
      success: true 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client', success: false },
      { status: 500 }
    );
  }
}
