import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z.string().min(1, 'Code is required').max(50),
  client: z.string().optional(),
  description: z.string().optional(),
  billable: z.boolean().default(true),
  status: z.enum(['active', 'on_hold', 'completed', 'archived']).default('active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  budgetHours: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  currency: z.string().default('USD'),
});

export const taskSchema = z.object({
  projectId: z.string().min(1),
  parentId: z.string().optional(),
  phaseId: z.string().optional(),
  name: z.string().min(1).max(500),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  estimatedHours: z.number().min(0).default(0),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  isEpic: z.boolean().optional(),
  isMilestone: z.boolean().optional(),
  dependencies: z.array(z.string()).default([]),
});

export const timeEntrySchema = z.object({
  userId: z.string().min(1),
  projectId: z.string().min(1),
  activity: z.string().min(1).max(500),
  notes: z.string().optional(),
  billable: z.boolean().default(true),
  weekNumber: z.number().int().min(1).max(53),
  year: z.number().int().min(2020).max(2100),
  hours: z.object({
    mon: z.number().min(0).max(24).default(0),
    tue: z.number().min(0).max(24).default(0),
    wed: z.number().min(0).max(24).default(0),
    thu: z.number().min(0).max(24).default(0),
    fri: z.number().min(0).max(24).default(0),
    sat: z.number().min(0).max(24).default(0),
    sun: z.number().min(0).max(24).default(0),
  }),
});

export const userSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'member']).default('member'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'member']).optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
  preferences: z.record(z.string(), z.boolean()).optional(),
});

export const allocationSchema = z.object({
  resourceId: z.string().min(1),
  projectId: z.string().min(1),
  weekNumber: z.number().int().min(1).max(53),
  year: z.number().int().min(2020).max(2100),
  allocatedHours: z.number().min(0).max(168),
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(200),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});
