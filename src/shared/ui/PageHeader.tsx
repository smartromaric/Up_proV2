interface PageHeaderProps {
  title: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            className="mb-1 truncate text-xs text-muted"
            aria-label="Fil d'Ariane"
          >
            {breadcrumb.join(" / ")}
          </nav>
        )}
        <h1 className="text-lg font-semibold tracking-tight text-heading sm:text-[22px]">
          {title}
        </h1>
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
