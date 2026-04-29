"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle2, Loader2, X, ChevronDown } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { tasksApi, projectsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
type Priority = "HIGH" | "MEDIUM" | "LOW";

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: "BACKLOG",     label: "Pendiente",   color: "bg-gray-400",    bg: "bg-gray-50" },
  { id: "IN_PROGRESS", label: "En Progreso", color: "bg-brand-500",   bg: "bg-brand-50/30" },
  { id: "REVIEW",      label: "En Revisión", color: "bg-info-500",    bg: "bg-info-50/30" },
  { id: "DONE",        label: "Completado",  color: "bg-success-500", bg: "bg-success-50/30" },
];

const PRIORITY_CONFIG: Record<Priority, { border: string; label: string; dot: string }> = {
  HIGH:   { border: "border-l-danger-500",  label: "Alta",  dot: "bg-danger-500" },
  MEDIUM: { border: "border-l-brand-500",   label: "Media", dot: "bg-brand-500" },
  LOW:    { border: "border-l-info-500",    label: "Baja",  dot: "bg-info-500" },
};

function TaskCard({ task, onMove }: { task: any; onMove: (id: string, status: TaskStatus) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority as Priority] ?? PRIORITY_CONFIG.MEDIUM;
  const isDone = task.status === "DONE";

  return (
    <div className={cn(
      "bg-white rounded-lg p-3 shadow-sm border border-gray-100 border-l-[3px] hover:shadow-md transition-shadow",
      priority.border, isDone && "opacity-60"
    )}>
      <div className={cn("text-sm font-semibold mb-2", isDone && "line-through text-gray-400")}>
        {task.title}
      </div>
      {task.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", priority.dot)} />
          <span className="text-[10px] text-gray-400">{priority.label}</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-navy-500 px-1.5 py-0.5 rounded border border-gray-200 hover:border-navy-300 transition-colors"
          >
            Mover <ChevronDown className="w-3 h-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[130px]">
              {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onMove(task.id, c.id); setMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
                >
                  → {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {task.dueDate && (
        <div className="mt-1.5 text-[10px] text-gray-300">
          {isDone ? "Completado" : `Vence ${new Date(task.dueDate).toLocaleDateString("es-AR")}`}
        </div>
      )}
    </div>
  );
}

function NewTaskModal({ projectId, onClose, onCreated }: {
  projectId: string; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", status: "BACKLOG", dueDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("El título es obligatorio"); return; }
    setSaving(true);
    setError(null);
    try {
      await tasksApi.create({
        projectId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-dark-800">Nueva tarea</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {error && <div className="text-danger-600 text-sm bg-danger-50 px-3 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Título *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
              placeholder="Ej. Inspección de columnas" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Descripción</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500 resize-none"
              placeholder="Detalles..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Prioridad</label>
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500">
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Columna</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500">
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fecha límite</label>
            <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500" />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear tarea
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TareasPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    projectsApi.getAll(user?.id)
      .then((data) => {
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  const loadTasks = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const data = await tasksApi.getByProject(selectedProjectId);
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleMove(taskId: string, newStatus: TaskStatus) {
    try {
      await tasksApi.move(taskId, newStatus);
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch {
      // silent
    }
  }

  const tasksByColumn = (colId: TaskStatus) => tasks.filter((t) => t.status === colId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-8 flex flex-col h-[calc(100vh-0px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">Tablero de Tareas</h1>
          <p className="text-sm text-gray-500 mt-1">Kanban de tareas por obra</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Project selector */}
          {projectsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : projects.length > 0 ? (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500 text-dark-800"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <span className="text-sm text-gray-400">Sin obras creadas</span>
          )}
          <button
            onClick={() => setShowModal(true)}
            disabled={!selectedProjectId}
            className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva tarea
          </button>
        </div>
      </div>

      {/* Stats row */}
      {selectedProject && !loading && (
        <div className="flex gap-4 mb-4">
          {COLUMNS.map((col) => {
            const count = tasksByColumn(col.id).length;
            return (
              <div key={col.id} className="flex items-center gap-2 text-sm">
                <span className={cn("w-2.5 h-2.5 rounded-full", col.color)} />
                <span className="text-gray-500">{col.label}:</span>
                <span className="font-bold text-dark-800">{count}</span>
              </div>
            );
          })}
          <span className="ml-auto text-xs text-gray-400">{tasks.length} tareas totales</span>
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
        </div>
      ) : !selectedProjectId ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Seleccioná una obra para ver sus tareas
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-4 gap-4 overflow-hidden">
          {COLUMNS.map((col) => {
            const colTasks = tasksByColumn(col.id);
            return (
              <div key={col.id} className={cn("flex flex-col rounded-xl overflow-hidden", col.bg)}>
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className={cn("w-2 h-2 rounded-full", col.color)} />
                  <span className="text-xs font-bold text-dark-800">{col.label}</span>
                  <span className="ml-auto text-[10px] font-bold text-gray-400 bg-white rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-300">Sin tareas</div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onMove={handleMove} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && selectedProjectId && (
        <NewTaskModal
          projectId={selectedProjectId}
          onClose={() => setShowModal(false)}
          onCreated={loadTasks}
        />
      )}
    </div>
  );
}
