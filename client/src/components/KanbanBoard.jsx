import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaBriefcase, FaBuilding, FaCalendarAlt } from "react-icons/fa";

const KanbanBoard = ({ searchQuery }) => {
  const [columns, setColumns] = useState({
    Applied: { name: "Applied", items: [], color: "bg-blue-600" },
    Interview: { name: "Interview", items: [], color: "bg-yellow-600" },
    Offer: { name: "Offer", items: [], color: "bg-green-600" },
    Rejected: { name: "Rejected", items: [], color: "bg-red-600" },
  });

  const userId = localStorage.getItem("userId");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchApplications = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${API_URL}/applications`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const newColumns = {
          Applied: { name: "Applied", items: [], color: "bg-blue-600" },
          Interview: { name: "Interview", items: [], color: "bg-yellow-600" },
          Offer: { name: "Offer", items: [], color: "bg-green-600" },
          Rejected: { name: "Rejected", items: [], color: "bg-red-600" },
        };

        // HATA ÖNLEYİCİ: Gelen verinin dizi olduğundan emin ol
        const apps = Array.isArray(res.data) ? res.data : (res.data.data || []);

        if (Array.isArray(apps)) {
            apps.forEach((app) => {
            if (newColumns[app.status]) {
                if (
                    searchQuery && 
                    !app.company.toLowerCase().includes(searchQuery.toLowerCase()) && 
                    !app.position.toLowerCase().includes(searchQuery.toLowerCase())
                ) {
                    return;
                }
                newColumns[app.status].items.push(app);
            }
            });
            setColumns(newColumns);
        }
      } catch (err) {
        console.error("Kanban Error:", err);
      }
    };
    fetchApplications();
  }, [userId, searchQuery, API_URL, token]);


  const onDragEnd = async (result) => {
    // ✅ KRİTİK DÜZELTME: draggableId burada tanımlanıyor!
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const startColumn = columns[source.droppableId];
    const finishColumn = columns[destination.droppableId];

    // 1. EKRAN GÜNCELLEMESİ (Optimistic UI)
    if (startColumn === finishColumn) {
      const newItems = Array.from(startColumn.items);
      const [movedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedItem);

      setColumns({
        ...columns,
        [source.droppableId]: { ...startColumn, items: newItems },
      });
    } else {
      const startItems = Array.from(startColumn.items);
      const [movedItem] = startItems.splice(source.index, 1);
      const finishItems = Array.from(finishColumn.items);
      
      const updatedItem = { ...movedItem, status: destination.droppableId };
      finishItems.splice(destination.index, 0, updatedItem);

      setColumns({
        ...columns,
        [source.droppableId]: { ...startColumn, items: startItems },
        [destination.droppableId]: { ...finishColumn, items: finishItems },
      });
    }

    // 2. BACKEND GÜNCELLEMESİ
    try {
      await axios.put(
        `${API_URL}/applications/${draggableId}`, 
        { status: destination.droppableId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Statü güncellendi");
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Güncelleme başarısız");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        {Object.entries(columns).map(([columnId, column]) => (
          <div key={columnId} className="flex-1 min-w-[280px]">
            <div className={`p-3 rounded-t-lg ${column.color} flex justify-between items-center`}>
              <h3 className="font-bold text-white">{column.name}</h3>
              <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded text-xs">
                {column.items.length}
              </span>
            </div>
            
            <Droppable droppableId={columnId}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`p-3 rounded-b-lg min-h-[500px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-gray-700 bg-opacity-50" : "bg-gray-800 bg-opacity-30"
                  } border border-gray-700 border-t-0`}
                >
                  {column.items.map((item, index) => (
                    <Draggable key={item.id || item._id} draggableId={item.id || item._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-4 mb-3 rounded-lg shadow-md border border-gray-700 hover:border-gray-500 transition-all group relative ${
                            snapshot.isDragging ? "bg-indigo-600 rotate-2 scale-105" : "bg-gray-800"
                          }`}
                        >
                          <Link to={`/edit/${item.id || item._id}`} className="block">
                             <h4 className="font-bold text-white text-lg mb-1">{item.company}</h4>
                             <p className="text-gray-400 text-sm mb-3">{item.position}</p>
                             <div className="flex items-center gap-3 text-xs text-gray-500">
                               <div className="flex items-center gap-1">
                                  <FaCalendarAlt />
                                  <span>{item.dateApplied ? new Date(item.dateApplied).toLocaleDateString() : 'No Date'}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                  <FaBuilding />
                                  <span>{item.workType}</span>
                               </div>
                             </div>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;