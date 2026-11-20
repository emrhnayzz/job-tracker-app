import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useI18n } from "../i18n";
import { useAuth } from "./AuthContext";

const ApplicationsContext = createContext(null);

const toFormData = (values, cvFile) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.append(key, value ?? "");
  if (cvFile) form.append("cv", cvFile);
  return form;
};

// Holds the applications and the inbox once for all pages of the app.
export const ApplicationsProvider = ({ children }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [applications, setApplications] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    () =>
      api
        .get("/applications")
        .then((res) => setApplications(res.data))
        .finally(() => setLoading(false)),
    []
  );
  const reloadInbox = useCallback(() => api.get("/inbox").then((res) => setInbox(res.data)), []);

  useEffect(() => {
    reload().catch(() => {});
    reloadInbox().catch(() => {});
  }, [reload, reloadInbox]);

  const value = useMemo(() => {
    const replace = (updated) =>
      setApplications((list) => list.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));

    // Automation: a new stage brings its typical next steps as tasks.
    // The server skips tasks that are already on the list.
    const addStageTasks = async (id, status) => {
      if (!user.auto_tasks) return;
      const titles = t(`tasks.suggest.${status}`).split("|").filter(Boolean);
      if (titles.length === 0) return;
      await api.post(`/applications/${id}/tasks`, { titles }).catch(() => {});
    };

    const afterMailChange = async (message) => {
      if (message.state === "applied" && message.application_id && message.application_status) {
        await addStageTasks(message.application_id, message.application_status);
      }
      await Promise.all([reload(), reloadInbox()]);
      return message;
    };

    return {
      applications,
      inbox,
      pendingMails: inbox.filter((mail) => mail.state === "pending").length,
      loading,
      reload,
      create: async (values, cvFile) => {
        const res = await api.post("/applications", toFormData(values, cvFile));
        setApplications((list) => [res.data, ...list]);
        addStageTasks(res.data.id, res.data.status).then(reload);
        return res.data;
      },
      update: async (id, values, cvFile) => {
        const res = await api.put(`/applications/${id}`, toFormData(values, cvFile));
        replace(res.data);
        return res.data;
      },
      // Optimistic: the card moves at once and jumps back if the server refuses.
      setStatus: async (id, status) => {
        const previous = applications.find((item) => item.id === id);
        replace({ id, status });
        try {
          const res = await api.patch(`/applications/${id}/status`, { status });
          replace({ ...res.data, last_activity_at: new Date().toISOString() });
          await addStageTasks(id, status);
          await reload();
        } catch (error) {
          if (previous) replace(previous);
          throw error;
        }
      },
      remove: async (id) => {
        await api.delete(`/applications/${id}`);
        setApplications((list) => list.filter((item) => item.id !== id));
        reloadInbox().catch(() => {});
      },

      pasteMail: (mail) => api.post("/inbox", mail).then((res) => afterMailChange(res.data)),
      applyMail: (id, applicationId) =>
        api.post(`/inbox/${id}/apply`, { application_id: applicationId }).then((res) => afterMailChange(res.data)),
      undoMail: (id) => api.post(`/inbox/${id}/undo`).then((res) => afterMailChange(res.data)),
      dismissMail: (id) => api.post(`/inbox/${id}/dismiss`).then((res) => afterMailChange(res.data)),
      removeMail: (id) => api.delete(`/inbox/${id}`).then(() => reloadInbox()),
    };
  }, [applications, inbox, loading, reload, reloadInbox, user.auto_tasks, t]);

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
};

export const useApplications = () => useContext(ApplicationsContext);
