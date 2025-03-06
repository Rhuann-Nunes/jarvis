export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  dueDate?: Date;
  recurrence?: string | {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  };
  projectId?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  isRecurrenceOccurrence?: boolean;
  originalTaskId?: string;
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface Project {
  id: string;
  name: string;
  color: string;
  userId?: string;
  sections: Section[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  id: string;
  name: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnalysisResult {
  title: string;
  dueDate?: Date;
  recurrence?: string | {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
  };
  projectName?: string;
  sectionName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
} 