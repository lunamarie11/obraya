"use client";

import { useState } from "react";
import { Plus, Filter, CheckCircle2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { tasks } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "backlog", label: "Pendiente", color: "bg-gray-400" },
  { id: "in_progress", label: "En Progreso", color: "bg-brand-500" },
  { id: "review", label: "En Revision", color: "bg-info-500" },
  { id: "done", label: "Completado", color: "bg-success-500" },
];

const priorityConfig = {
  high: { border: "border-l-danger-500", label: "Alta" },
  medium: { border: "border-l-brand-500", label: "Media" },
  low: { border: "border-l-info-500", label: "Baja" },
};

function TaskCard({ task }: { task: Task }) {
  const priority = priorityConfig[task.priority];
  const isDone = task.status === "done";

  return (
    <div
      className={cn(
        "bg-white rounded-lg p-3 shadow-sm border border-gray-100 border-l-[3px] cursor-grab hover:shadow-md transition-shadow",
        priority.border,
        isDone && "opacity-60"
      )}
    >
      <div className={cn("text-sm font-semibold mb-2", isDone && "line-through text-gray-400")}>
        {task.title}
      </div>

      {task.progress !== undefined && !isDone && (
        <div className="mb-2">
          <ProgressBar value={task.progress} size="sm" />
          <div className="text-[10px] text-gray-400 mt-1">
            {task.progress}%
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {isDone && task.completed_date
            ? `Completado ${formatDate(task.completed_date)}`
            : formatDate(task.due_date)}
        </span>
        {isDone ? (
          <CheckCircle2 className="w-4 h-4 text-success-500" />
        ) : (
          <Avatar
            initials={task.assigned_to.initials}
            color={task.assigned_to.avatar_color}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}

export default function TareasPage() {
  const [allTasks] = useState(tasks);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">
            Tablero de Tareas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Casa Familia Lopez — Sprint Abril
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-dark-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-5">
        {columns.map((column) => {
          const columnTasks = allTasks.filter((t) => t.status === column.id);
          return (
            <div key={column.id} className="bg-gray-100/80 rounded-xl p-3 min-h-[500px]">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", column.color)} />
                  <span className="text-sm font-bold text-dark-800">
                    {column.label}
                  </span>
                </div>
                <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 font-semibold">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
