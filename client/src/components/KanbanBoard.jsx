import { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { BellRing, CalendarClock, ListChecks, MapPin, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { matchSkills } from "../lib/skills";
import { STATUSES, STATUS_STYLE, daysSince, needsFollowUp } from "../lib/status";
import { Interest } from "./Extras";

const CardMeta = ({ app }) => {
  const { t, formatDateTime } = useI18n();

  if (app.status === "Interview" && app.interview_date) {
    return (
      <span className="flex items-center gap-1 font-medium text-interview">
        <CalendarClock size={13} /> {formatDateTime(app.interview_date)}
      </span>
    );
  }
  if (needsFollowUp(app)) {
    return (
      <span className="flex items-center gap-1 font-medium text-interview">
        <BellRing size={13} /> {t("card.followUp")}
      </span>
    );
  }
  if (app.status === "Saved" || !app.applied_date) return null;
  const days = daysSince(app.applied_date);
  return <span>{days <= 0 ? t("card.today") : t("card.daysAgo", { count: days })}</span>;
};

const Card = ({ app, index }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  // For saved jobs the match helps to decide where to apply first.
  const match = app.status === "Saved" ? matchSkills(app, user) : null;

  return (
    <Draggable draggableId={String(app.id)} index={index}>
      {(provided, snapshot) => (
        <Link
          to={`/app/a/${app.id}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 block rounded-xl border bg-surface p-3.5 transition-shadow ${
            snapshot.isDragging ? "border-accent shadow-lift" : "border-line shadow-card hover:border-muted/50"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug">{app.company}</p>
            <Interest value={app.interest} size={12} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{app.position}</p>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
            <span className="flex min-w-0 items-center gap-2.5">
              {app.location && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{app.location}</span>
                </span>
              )}
              {app.open_tasks > 0 && (
                <span className="flex shrink-0 items-center gap-1" title={t("card.openTasks", { count: app.open_tasks })}>
                  <ListChecks size={13} /> {app.open_tasks}
                </span>
              )}
            </span>
            <span className="shrink-0">
              {match ? (
                <span className="rounded-full bg-offer/10 px-2 py-0.5 font-semibold text-offer">
                  {t("card.match", { score: match.score })}
                </span>
              ) : (
                <CardMeta app={app} />
              )}
            </span>
          </div>
        </Link>
      )}
    </Draggable>
  );
};

// Two fields in the column head: the quickest way to note a job.
const QuickAdd = ({ status, onAdd, onClose }) => {
  const { t } = useI18n();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!company.trim() || !position.trim()) return;
    onAdd({ company: company.trim(), position: position.trim(), status });
    onClose();
  };

  return (
    <form onSubmit={submit} onKeyDown={(event) => event.key === "Escape" && onClose()} className="mb-2 space-y-1.5 rounded-xl border border-accent bg-surface p-2.5">
      <input autoFocus value={company} onChange={(event) => setCompany(event.target.value)} placeholder={t("field.company")} className="input !py-1.5" maxLength={255} />
      <input value={position} onChange={(event) => setPosition(event.target.value)} placeholder={t("field.position")} className="input !py-1.5" maxLength={255} />
      <div className="flex justify-end gap-1.5">
        <button type="button" onClick={onClose} className="btn-quiet !py-1.5 text-xs">{t("action.cancel")}</button>
        <button type="submit" className="btn-primary !py-1.5 text-xs">{t("action.create")}</button>
      </div>
    </form>
  );
};

// Most wanted first, then newest.
const byPriority = (a, b) => (b.interest || 0) - (a.interest || 0) || new Date(b.created_at) - new Date(a.created_at);

export default function KanbanBoard({ applications, onMove, onAdd }) {
  const { t } = useI18n();
  const [addingTo, setAddingTo] = useState(null);

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    onMove(Number(draggableId), destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {STATUSES.map((status) => {
          const items = applications.filter((app) => app.status === status).sort(byPriority);
          return (
            <section key={status} className="flex w-[272px] shrink-0 flex-col lg:w-auto lg:min-w-0 lg:flex-1">
              <header className="mb-2 flex items-center gap-2 px-1.5">
                <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[status].dot}`} />
                <h2 className="text-sm font-semibold">{t(`status.${status}`)}</h2>
                <span className="text-sm tabular-nums text-muted">{items.length}</span>
                <button
                  onClick={() => setAddingTo(addingTo === status ? null : status)}
                  className="ml-auto rounded-md p-1 text-muted transition hover:bg-sunken hover:text-ink"
                  aria-label={t("board.quickAdd", { status: t(`status.${status}`) })}
                  title={t("board.quickAdd", { status: t(`status.${status}`) })}
                >
                  <Plus size={15} />
                </button>
              </header>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[320px] flex-1 rounded-2xl p-2 transition-colors ${
                      snapshot.isDraggingOver ? `${STATUS_STYLE[status].soft} ring-1 ring-inset ring-line` : "bg-sunken/70"
                    } ${status === "Rejected" ? "opacity-80" : ""}`}
                  >
                    {addingTo === status && <QuickAdd status={status} onAdd={onAdd} onClose={() => setAddingTo(null)} />}
                    {items.map((app, index) => (
                      <Card key={app.id} app={app} index={index} />
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && addingTo !== status && !snapshot.isDraggingOver && (
                      <p className="px-2 py-6 text-center text-xs text-muted">{t(`board.empty.${status}`)}</p>
                    )}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}
