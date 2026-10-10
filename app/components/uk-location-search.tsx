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
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(-1);
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected || !focused || value.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch("/api/recovery/location-suggest?q=" + encodeURIComponent(value.trim()), {
          signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
          setMessage(data.message || "");
          setActive(-1);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setMessage("Suggestions unavailable. Enter a full UK postcode manually.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);
    return () => { clearTimeout(t); controller.abort(); };
  }, [focused, selected, value]);

  function choose(suggestion: UkLocationSuggestion) {
    setSelected(true);
    setFocused(false);
    setSuggestions([]);
    setActive(-1);
    setMessage("");
    onSelect(suggestion);
  }

  const show = focused && !selected && value.trim().length >= 2;

  return (
    <div className="uk-location-field" ref={containerRef}>
      <label htmlFor={id} className="uk-location-label">{label}{required ? " *" : ""}</label>
      <div className="uk-location-input-wrap">
        <span aria-hidden="true" className="uk-location-pin">⌖</span>
        <input id={id} ref={inputRef} type="text" role="combobox" autoComplete="off" autoCorrect="off"
          spellCheck={false} required={required} placeholder={placeholder} value={value}
          aria-autocomplete="list" aria-expanded={show && suggestions.length > 0}
          aria-controls={id + "-suggestions"}
          aria-activedescendant={show && active >= 0 ? id + "-item-" + active : undefined}
          onFocus={() => { setFocused(true); setSelected(false); }}
          onBlur={(e) => {
            if (!containerRef.current?.contains(e.relatedTarget as Node)) setFocused(false);
          }}
          onChange={(e) => { onChange(e.target.value); setSelected(false); setActive(-1); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setFocused(false); setActive(-1); }
            if (!show || !suggestions.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive(x => (x + 1) % suggestions.length); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive(x => (x <= 0 ? suggestions.length - 1 : x - 1)); }
            if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(suggestions[active]); }
          }}
        />
      </div>
      {show && (
        <div className="uk-location-menu" id={id + "-suggestions"} role="listbox"
          aria-label={label + " location suggestions"}>
          {loading && <p className="uk-location-help" role="status">Searching UK locations…</p>}
          {!loading && suggestions.map((s, i) => (
            <button type="button" role="option" aria-selected={i === active}
              id={id + "-item-" + i} className={"uk-location-option" + (i === active ? " active" : "")}
              key={s.id} onMouseDown={e => e.preventDefault()} onClick={() => choose(s)}>
              <span aria-hidden="true">⌖</span>
              <span><strong>{s.label}</strong><small>{s.detail}{s.postcode ? " · Confirmed postcode" : " · Exact postcode required later"}</small></span>
            </button>
          ))}
          {!loading && !suggestions.length && <p className="uk-location-help" role="status">
            {message || "No matching suggestions. Try another spelling or a complete UK postcode."}
          </p>}
        </div>
      )}
    </div>
  );
}
