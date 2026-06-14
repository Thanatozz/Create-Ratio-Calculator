import { ChevronDown, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../../i18n";

const MAX_VISIBLE_RESULTS = 200;

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectFieldProps {
  label: string;
  value: string;
  options: SearchSelectOption[];
  onChange: (value: string) => void;
  icon?: ReactNode;
}

/**
 * Generic searchable single-select combobox. Used wherever an option list can
 * grow large (e.g. recipe selection once the real Create base is enabled).
 */
export function SearchSelectField({
  label,
  value,
  options,
  onChange,
  icon
}: SearchSelectFieldProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  const visible = filtered.slice(0, MAX_VISIBLE_RESULTS);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointer(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  function selectOption(next: string) {
    onChange(next);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => Math.min(index + 1, visible.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = visible[highlight];
      if (option) {
        selectOption(option.value);
      }
    }
  }

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  return (
    <div className="grid gap-1.5 text-sm text-stone-300" ref={containerRef}>
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500">
        {icon}
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          className="create-control flex h-10 w-full items-center justify-between gap-2 px-3 text-left text-sm text-stone-100 outline-none transition focus:border-factory-brass"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown size={16} className="shrink-0 text-stone-400" />
        </button>

        {open ? (
          <div className="create-panel absolute left-0 right-0 z-30 mt-1 grid max-h-[60vh] gap-2 p-2 shadow-panel">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                ref={inputRef}
                type="text"
                className="create-control h-9 w-full pl-7 pr-2 text-sm text-stone-100 outline-none"
                placeholder={t("factory.searchRecipes")}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setHighlight(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
            <ul className="industrial-scrollbar max-h-64 overflow-auto" role="listbox">
              {visible.length === 0 ? (
                <li className="px-2 py-3 text-center text-xs text-stone-500">
                  {t("factory.noRecipesFound")}
                </li>
              ) : (
                visible.map((option, index) => (
                  <li key={option.value} role="option" aria-selected={option.value === value}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                        index === highlight
                          ? "bg-factory-panel2 text-stone-100"
                          : "text-stone-200 hover:bg-factory-panel2"
                      }`}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => selectOption(option.value)}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    </button>
                  </li>
                ))
              )}
              {filtered.length > MAX_VISIBLE_RESULTS ? (
                <li className="px-2 py-2 text-center text-[11px] text-stone-500">
                  {t("factory.moreResults", {
                    count: filtered.length - MAX_VISIBLE_RESULTS
                  })}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
