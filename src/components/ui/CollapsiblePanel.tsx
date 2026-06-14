import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "../../i18n";

interface CollapsiblePanelProps {
  title: ReactNode;
  icon?: ReactNode;
  /** Initial open state for uncontrolled use. Ignored when `open` is provided. */
  defaultOpen?: boolean;
  /** Controlled open state. When provided, the panel is controlled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional content rendered on the right of the header (does not toggle). */
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Themed collapsible panel with a full-width header bar + chevron.
 * Up arrow when open, down arrow when closed; accessible collapse/expand label.
 * Works controlled (pass `open`) or uncontrolled (`defaultOpen`).
 */
export function CollapsiblePanel({
  title,
  icon,
  defaultOpen = true,
  open,
  onOpenChange,
  right,
  children,
  className = "",
  bodyClassName = "p-4"
}: CollapsiblePanelProps) {
  const t = useTranslation();
  const bodyId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  function toggle() {
    const next = !isOpen;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  return (
    <section className={`create-panel ${className}`}>
      <div className="flex items-stretch">
        <button
          type="button"
          className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 border-b border-factory-border px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-factory-brass"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          aria-label={isOpen ? t("common.collapseSection") : t("common.expandSection")}
        >
          {icon}
          <span className="min-w-0 flex-1 break-words">{title}</span>
          {isOpen ? (
            <ChevronUp size={18} className="shrink-0 text-stone-400" />
          ) : (
            <ChevronDown size={18} className="shrink-0 text-stone-400" />
          )}
        </button>
        {right ? (
          <div className="flex items-center border-b border-factory-border pr-3">
            {right}
          </div>
        ) : null}
      </div>
      {isOpen ? (
        <div id={bodyId} className={bodyClassName}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
