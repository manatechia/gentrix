interface WorkspaceToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export function WorkspaceToolbar({
  query,
  onQueryChange,
}: WorkspaceToolbarProps) {
  return (
    <section className="flex items-center justify-between gap-4 rounded-[28px] border border-[rgba(0,102,132,0.08)] bg-white/92 p-[18px] shadow-panel backdrop-blur-sm max-[1180px]:flex-col max-[1180px]:items-stretch">
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex min-h-[46px] items-center justify-center rounded-[14px] bg-brand-primary px-[18px] text-white font-semibold shadow-brand">
          Consola unica
        </span>
        <span className="inline-flex min-h-[46px] items-center justify-center rounded-[14px] bg-brand-secondary/12 px-[18px] text-brand-secondary font-semibold">
          Sin admin separado
        </span>
        <span className="inline-flex min-h-[46px] items-center justify-center rounded-[14px] border border-[rgba(47,79,79,0.16)] bg-white px-[18px] text-brand-secondary font-semibold">
          Alta por sidebar
        </span>
      </div>

      <label className="flex min-h-[54px] min-w-[min(100%,320px)] flex-1 items-center gap-3 rounded-[18px] border border-[rgba(47,79,79,0.16)] bg-brand-neutral px-4">
        <span className="text-[0.92rem] text-brand-text-muted">Buscar</span>
        <input
          className="min-h-full w-full border-0 bg-transparent p-0 text-brand-text outline-none"
          type="search"
          placeholder="Paciente, habitacion o nivel de cuidado"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
    </section>
  );
}
