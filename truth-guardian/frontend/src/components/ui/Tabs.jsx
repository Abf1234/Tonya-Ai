export default function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`min-h-10 rounded-lg px-3 text-xs font-extrabold transition-[background-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500 ${active ? 'bg-white text-guardian-900 shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
