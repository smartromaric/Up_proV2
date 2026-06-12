"use client";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tabs-scroll" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors duration-150 sm:px-4 ${
            active === tab.id
              ? "text-teal-dark"
              : "text-muted hover:text-foreground"
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal" />
          )}
        </button>
      ))}
    </div>
  );
}
