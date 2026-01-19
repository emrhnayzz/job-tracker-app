import React from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FaCalendarAlt } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

// --- 1. DRAGGABLE CARD COMPONENT ---
const KanbanCard = ({ app }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: app.id.toString(),
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        touch-none select-none  
        bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-3 cursor-grab hover:shadow-md transition-shadow
        ${
          isDragging
            ? "opacity-50 ring-2 ring-indigo-500 rotate-2 cursor-grabbing z-50"
            : ""
        }
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-100">
          {app.company}
        </h4>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">
        {app.position}
      </p>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <FaCalendarAlt />
        <span>
          {app.applied_date
            ? new Date(app.applied_date).toLocaleDateString()
            : "No Date"}
        </span>
      </div>
    </div>
  );
};

// --- 2. DROPPABLE COLUMN COMPONENT ---
const KanbanColumn = ({ id, title, apps, color }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex-1 min-w-[250px] flex flex-col h-full">
      {/* Header */}
      <div
        className={`flex items-center gap-2 p-3 rounded-t-lg ${color} bg-opacity-20 border-b-2 border-opacity-50`}
      >
        <div
          className={`w-3 h-3 rounded-full ${color.replace("bg-", "bg-text-")}`}
        ></div>
        <h3 className="font-bold text-gray-700 dark:text-gray-200">{title}</h3>
        <span className="ml-auto bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-500 dark:text-gray-300 font-bold shadow-sm">
          {apps.length}
        </span>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border border-t-0 border-gray-100 dark:border-gray-700 transition-colors
          ${
            isOver
              ? "bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-800"
              : ""
          }
        `}
      >
        {apps.map((app) => (
          <KanbanCard key={app.id} app={app} />
        ))}
        {apps.length === 0 && (
          <div className="h-20 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};

// --- 3. MAIN BOARD CONTAINER ---
const KanbanBoard = ({ applications, setApplications }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const columns = [
    { id: "Applied", title: "Applied", color: "bg-blue-500 border-blue-500" },
    {
      id: "Interview",
      title: "Interview",
      color: "bg-yellow-500 border-yellow-500",
    },
    { id: "Offer", title: "Offer", color: "bg-green-500 border-green-500" },
    { id: "Rejected", title: "Rejected", color: "bg-red-500 border-red-500" },
  ];

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const appId = parseInt(active.id);
    const newStatus = over.id;
    const app = applications.find((a) => a.id === appId);

    if (!app || app.status === newStatus) return;

    // UI Update
    const updatedApps = applications.map((a) =>
      a.id === appId ? { ...a, status: newStatus } : a
    );
    setApplications(updatedApps);

    // Backend Update
    try {
      const payload = {
        company: app.company,
        position: app.position,
        status: newStatus,
        applied_date: app.applied_date
          ? new Date(app.applied_date).toISOString().split("T")[0]
          : null,
        work_type: app.work_type,
        location: app.location,
        salary_min: app.salary_min,
        salary_max: app.salary_max,
        currency: app.currency,
        link: app.link,
        description: app.description,
        recruiter_name: app.recruiter_name,
        recruiter_email: app.recruiter_email,
        notes: app.notes,
      };

      await axios.put(
        (import.meta.env.VITE_API_URL || "http://localhost:5001") +
          `/applications/${draggableId}`,
        { status: destination.droppableId }
      );
      toast.success(`Moved to ${newStatus} 🎉`);
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update status");
      setApplications(applications);
    }
  };

  return (
    // 4. CRITICAL: collisionDetection={closestCorners} EKLE
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            apps={applications.filter((app) => app.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
