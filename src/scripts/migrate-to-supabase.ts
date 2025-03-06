import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Constants for localStorage keys
const STORAGE_KEYS = {
  TASKS: 'jarvis_tasks',
  PROJECTS: 'jarvis_projects',
};

/**
 * Script to migrate data from localStorage to Supabase using Prisma
 * Run this script in the browser console when you're ready to migrate
 */
export async function migrateToSupabase(email: string, name: string = 'User', image?: string) {
  // Create user if doesn't exist
  const userEmail = email.toLowerCase();
  let user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.log(`Creating new user for ${email}`);
    user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: userEmail,
        name,
        image,
      },
    });
  } else {
    console.log(`Found existing user for ${email}`);
  }

  // Migrate Projects and Sections
  const projectsJson = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (projectsJson) {
    const projects = JSON.parse(projectsJson);
    console.log(`Found ${projects.length} projects to migrate`);

    for (const project of projects) {
      // Check if project already exists (by name)
      const existingProject = await prisma.project.findFirst({
        where: {
          userId: user.id,
          name: project.name,
        },
      });

      if (existingProject) {
        console.log(`Project ${project.name} already exists, skipping`);
        continue;
      }

      // Create project
      console.log(`Creating project ${project.name}`);
      const newProject = await prisma.project.create({
        data: {
          id: project.id,
          name: project.name,
          color: project.color,
          userId: user.id,
        },
      });

      // Create sections
      if (project.sections && project.sections.length > 0) {
        for (const section of project.sections) {
          console.log(`Creating section ${section.name} in project ${project.name}`);
          await prisma.section.create({
            data: {
              id: section.id,
              name: section.name,
              projectId: newProject.id,
            },
          });
        }
      }
    }
  }

  // Migrate Tasks
  const tasksJson = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (tasksJson) {
    const tasks = JSON.parse(tasksJson);
    console.log(`Found ${tasks.length} tasks to migrate`);

    for (const task of tasks) {
      // Skip task occurrences
      if (task.isRecurrenceOccurrence) {
        console.log(`Skipping recurrence occurrence ${task.title}`);
        continue;
      }

      // Check if task already exists (by id)
      const existingTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      if (existingTask) {
        console.log(`Task ${task.title} already exists, skipping`);
        continue;
      }

      // Process recurrence
      let recurrenceType = null;
      let recurrenceInterval = null;
      let recurrenceDaysOfWeek: number[] = [];

      if (task.recurrence) {
        if (typeof task.recurrence === 'string') {
          // Handle string recurrence (old format)
          recurrenceType = 'daily';
          recurrenceInterval = 1;
        } else {
          // Handle object recurrence (new format)
          recurrenceType = task.recurrence.type;
          recurrenceInterval = task.recurrence.interval;
          recurrenceDaysOfWeek = task.recurrence.daysOfWeek || [];
        }
      }

      // Create task
      console.log(`Creating task ${task.title}`);
      await prisma.task.create({
        data: {
          id: task.id,
          title: task.title,
          description: task.description || null,
          completed: task.completed || false,
          completedAt: task.completedAt ? new Date(task.completedAt) : null,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          recurrenceType,
          recurrenceInterval,
          recurrenceDaysOfWeek,
          isRecurrenceOccurrence: false,
          originalTaskId: task.originalTaskId || null,
          projectId: task.projectId || null,
          sectionId: task.sectionId || null,
          userId: user.id,
        },
      });
    }
  }

  console.log('Migration completed');
}

// This script should be executed in the browser console
// Example: migrateToSupabase('user@example.com', 'John Doe') 