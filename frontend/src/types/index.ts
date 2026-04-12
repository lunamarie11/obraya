export type UserRole = "owner" | "contractor" | "architect" | "supplier";

export type ProjectStatus =
  | "on_track"
  | "at_risk"
  | "delayed"
  | "completed"
  | "paused";

export type TaskStatus = "backlog" | "in_progress" | "review" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface User {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  email: string;
  avatar_color: string;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  area: string;
  location: string;
  budget: number;
  spent: number;
  progress: number;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  team: User[];
}

export interface Task {
  id: string;
  title: string;
  project_id: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: User;
  due_date: string;
  progress?: number;
  completed_date?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

export interface Expense {
  id: string;
  date: string;
  concept: string;
  category: string;
  amount: number;
  registered_by: string;
}

export interface Professional {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  reviews: number;
  projects_count: number;
  years_experience: number;
  tags: string[];
  avatar_color: string;
  location: string;
}
