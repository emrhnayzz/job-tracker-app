import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import de from "./de";
import en from "./en";

const DICTIONARIES = { de, en };
const LOCALES = { de: "de-DE", en: "en-GB" };
const LanguageContext = createContext(null);

const initialLanguage = () => {
  const stored = localStorage.getItem("lang");
  if (stored === "de" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(initialLanguage);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // t("key", { name: "x" }) replaces {name}. With a `count`, the key gets the
  // suffix _one or _other.
  const t = useCallback(
    (key, vars) => {
      const fullKey = vars && typeof vars.count === "number" ? `${key}_${vars.count === 1 ? "one" : "other"}` : key;
      let message = DICTIONARIES[lang][fullKey] ?? en[fullKey] ?? fullKey;
      if (vars) for (const [name, value] of Object.entries(vars)) message = message.replaceAll(`{${name}}`, value);
      return message;
    },
    [lang]
  );

  const value = useMemo(() => {
    const locale = LOCALES[lang];
    return {
      lang,
      setLang,
      t,
      formatDate: (date, options = { day: "numeric", month: "short", year: "numeric" }) =>
        date ? new Intl.DateTimeFormat(locale, options).format(new Date(date)) : "",
      formatDateTime: (date) =>
        date
          ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(
              new Date(date)
            )
          : "",
    };
  }, [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useI18n = () => useContext(LanguageContext);
