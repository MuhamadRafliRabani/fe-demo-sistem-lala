import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ children }) {
  return (
    <nav className="flex items-center space-x-2" aria-label="pagination">
      {children}
    </nav>
  );
}

export function PaginationContent({ children }) {
  return <ul className="flex items-center gap-1">{children}</ul>;
}

export function PaginationItem({ children }) {
  return <li>{children}</li>;
}

export function PaginationLink({ isActive, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors ${
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function PaginationPrevious({ onClick, "aria-disabled": ariaDisabled }) {
  const disabled = Boolean(ariaDisabled);

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
      disabled={disabled}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
}

export function PaginationNext({ onClick, "aria-disabled": ariaDisabled }) {
  const disabled = Boolean(ariaDisabled);

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
      disabled={disabled}
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

