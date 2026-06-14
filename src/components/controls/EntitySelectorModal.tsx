import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useTranslation } from "../../i18n";

export interface SelectorRow {
  value: string;
  /** Pre-computed lowercase haystack used for filtering. */
  searchText: string;
}

interface SourceFilterConfig {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface EntitySelectorModalProps<R extends SelectorRow> {
  open: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  value: string;
  rows: R[];
  renderRow: (row: R, opts: { active: boolean; selected: boolean }) => ReactNode;
  onSelect: (value: string) => void;
  sourceFilter?: SourceFilterConfig;
  rowHeight?: number;
  emptyText?: string;
}

export function EntitySelectorModal<R extends SelectorRow>({
  open,
  onClose,
  title,
  searchPlaceholder,
  value,
  rows,
  renderRow,
  onSelect,
  sourceFilter,
  rowHeight = 56,
  emptyText
}: EntitySelectorModalProps<R>) {
  const t = useTranslation();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Light debounce so typing stays snappy over thousands of rows.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim().toLowerCase()), 120);
    return () => window.clearTimeout(id);
  }, [query]);

  const filtered = useMemo(() => {
    if (!debounced) {
      return rows;
    }
    const terms = debounced.split(/\s+/).filter(Boolean);
    return rows.filter((row) => terms.every((term) => row.searchText.includes(term)));
  }, [rows, debounced]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10
  });

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      return;
    }
    const selectedIndex = filtered.findIndex((row) => row.value === value);
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    const focusId = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(focusId);
    // Only when opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clamp highlight when the filtered list shrinks.
  useEffect(() => {
    setHighlight((index) => Math.min(index, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  function commit(next: string) {
    onSelect(next);
    onClose();
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlight((index) => {
          const next = Math.min(index + 1, filtered.length - 1);
          virtualizer.scrollToIndex(next, { align: "auto" });
          return next;
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlight((index) => {
          const next = Math.max(index - 1, 0);
          virtualizer.scrollToIndex(next, { align: "auto" });
          return next;
        });
      } else if (event.key === "Enter") {
        const row = filtered[highlight];
        if (row) {
          event.preventDefault();
          commit(row.value);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filtered, highlight]);

  if (!open) {
    return null;
  }

  const items = virtualizer.getVirtualItems();

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex bg-black/60 ${
        isMobile ? "items-stretch" : "items-center justify-center p-4"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`create-panel flex min-h-0 flex-col ${
          isMobile ? "h-full w-full" : "max-h-[80vh] w-[min(92vw,640px)]"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-2 border-b border-factory-border px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-wide text-factory-brass">
            {title}
          </span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-factory-border bg-factory-panel2 text-stone-200 hover:border-factory-brass"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-2 border-b border-factory-border p-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500"
            />
            <input
              ref={inputRef}
              type="text"
              className="create-control h-11 w-full pl-8 pr-3 text-base text-stone-100 outline-none"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {sourceFilter ? (
            <select
              className="create-control h-10 px-2 text-sm text-stone-100 outline-none"
              value={sourceFilter.value}
              onChange={(event) => sourceFilter.onChange(event.target.value)}
              aria-label={t("factory.sourceFilter")}
            >
              {sourceFilter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div
          ref={scrollRef}
          className="industrial-scrollbar min-h-0 flex-1 overflow-auto p-2"
        >
          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-stone-500">
              {emptyText ?? t("factory.noResults")}
            </div>
          ) : (
            <div
              style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
            >
              {items.map((virtualRow) => {
                const row = filtered[virtualRow.index];
                const selected = row.value === value;
                const active = virtualRow.index === highlight;
                return (
                  <div
                    key={row.value}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`
                    }}
                  >
                    <button
                      type="button"
                      className={`flex min-h-[52px] w-full items-center gap-3 rounded-md border px-3 py-2 text-left ${
                        selected
                          ? "border-factory-brass bg-factory-panel2"
                          : active
                            ? "border-factory-border bg-factory-panel2"
                            : "border-transparent hover:bg-factory-panel2"
                      }`}
                      onMouseEnter={() => setHighlight(virtualRow.index)}
                      onClick={() => commit(row.value)}
                    >
                      {renderRow(row, { active, selected })}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
