import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const ApplicationsContext = createContext(null);

const toFormData = (values, cvFile) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.append(key, value ?? "");
  if (cvFile) form.append("cv", cvFile);
  return form;
};

// Holds the list once for the board, the list view and the insights page.
export const ApplicationsProvider = ({ children }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    () =>
      api
        .get("/applications")
        .then((res) => setApplications(res.data))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const value = useMemo(() => {
    const replace = (updated) =>
      setApplications((list) => list.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));

    return {
      applications,
      loading,
      reload,
      create: async (values, cvFile) => {
        const res = await api.post("/applications", toFormData(values, cvFile));
        setApplications((list) => [res.data, ...list]);
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
        } catch (error) {
          if (previous) replace(previous);
          throw error;
        }
      },
      remove: async (id) => {
        await api.delete(`/applications/${id}`);
        setApplications((list) => list.filter((item) => item.id !== id));
      },
    };
  }, [applications, loading, reload]);

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
};

export const useApplications = () => useContext(ApplicationsContext);
