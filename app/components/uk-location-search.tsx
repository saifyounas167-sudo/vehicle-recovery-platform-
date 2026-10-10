"use client";

import { useEffect, useId, useRef, useState } from "react";

export type UkLocationSuggestion = {
  id: string;
  label: string;
  detail: string;
  postcode: string | null;
  kind: string;
};
type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: UkLocationSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
};

export default function UkLocationSearch({
  label, value, onChange, onSelect, placeholder = "Postcode, town or address", required = false, inputRef,
}: Props) {
  const [suggestions, setSuggestions] = useState<UkLocationSuggestion[]>([]);
  const [resultsFor, setResultsFor] = useState("");
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(-1);
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const query = value.trim();

  // Invalidate old results immediately (not only after the next effect runs).
  // This prevents London from displaying locations returned for an older search.
  const matchesCurrentQuery = resultsFor === query;
  const visibleSuggestions = !loading && matchesCurrentQuery ? suggestions : [];

  useEffect(() => {
    if (selected || !focused || query.length < 2) {
      abortRef.current?.abort();
      setSuggestions([]);
      setResultsFor("");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const requestNumber = ++requestRef.current;
    setLoading(true);
    setSuggestions([]);
    setResultsFor("");
    setMessage("");

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/recovery/location-suggest?q=" + encodeURIComponent(query), {
          signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("Location search unavailable");
        const data = await response.json();
        if (!controller.signal.aborted && requestRef.current === requestNumber) {
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
          setResultsFor(query);
          setMessage(data.message || "");
          setActive(-1);
        }
      } catch {
        if (!controller.signal.aborted && requestRef.current === requestNumber) {
          setSuggestions([]);
          setResultsFor(query);
          setMessage("Location search is temporarily unavailable. Enter a full UK postcode manually.");
        }
      } finally {
        if (!controller.signal.aborted && requestRef.current === requestNumber) setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
      if (abortRef.current === controller) abortRef.current = null;
    };
  }, [focused, selected, query]);

  function choose(suggestion: UkLocationSuggestion) {
    requestRef.current += 1;
    abortRef.current?.abort();
    setSelected(true);
    setFocused(false);
    setSuggestions([]);
    setResultsFor("");
    setLoading(false);
    setActive(-1);
    setMessage("");
    onSelect(suggestion);
  }

  function change(next: string) {
    requestRef.current += 1;
    abortRef.current?.abort();
    setSuggestions([]);
    setResultsFor("");
    setMessage("");
    setActive(-1);
    setLoading(next.trim().length >= 2);
    setSelected(false);
    onChange(next);
  }

  const show = focused && !selected && query.length >= 2;
  const showResults = show && visibleSuggestions.length > 0;
  const showStatus = show && !loading && !visibleSuggestions.length && matchesCurrentQuery;

  return (
    <div className="uk-location-field" ref={containerRef}>
      <label htmlFor={id} className="uk-location-label">{label}{required ? " *" : ""}</label>
      <div className="uk-location-input-wrap">
        <span aria-hidden="true" className="uk-location-pin">⌖</span>
        <input id={id} ref={inputRef} type="text" role="combobox" autoComplete="off" autoCorrect="off"
          spellCheck={false} required={required} placeholder={placeholder} value={value}
          aria-autocomplete="list" aria-expanded={showResults}
          aria-controls={id + "-suggestions"}
          aria-activedescendant={showResults && active >= 0 ? id + "-item-" + active : undefined}
          aria-busy={loading}
          onFocus={() => setFocused(true)}
          onBlur={e => {
            if (!containerRef.current?.contains(e.relatedTarget as Node)) setFocused(false);
          }}
          onChange={e => change(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Escape") { setFocused(false); setActive(-1); }
            if (!showResults) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive(x => (x + 1) % visibleSuggestions.length); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive(x => (x <= 0 ? visibleSuggestions.length - 1 : x - 1)); }
            if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(visibleSuggestions[active]); }
          }}
        />
        {loading && show && <span className="uk-location-loading" aria-label="Searching UK locations" role="status" />}
      </div>
      {showResults && (
        <div className="uk-location-menu" id={id + "-suggestions"} role="listbox"
          aria-label={label + " location suggestions"}>
          {visibleSuggestions.map((s, i) => (
            <button type="button" role="option" aria-selected={i === active}
              id={id + "-item-" + i} className={"uk-location-option" + (i === active ? " active" : "")}
              key={s.id} onMouseDown={e => e.preventDefault()} onClick={() => choose(s)}>
              <span aria-hidden="true">⌖</span>
              <span><strong>{s.label}</strong><small>{s.detail}{s.postcode ? " · Confirmed postcode" : " · Exact postcode required later"}</small></span>
            </button>
          ))}
        </div>
      )}
      {showStatus && (
        <p className="uk-location-inline-status" role="status">
          {message || "No matching UK locations. Try another spelling or a complete postcode."}
        </p>
      )}
    </div>
  );
}
