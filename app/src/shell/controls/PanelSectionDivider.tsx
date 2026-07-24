/** Full-bleed section rule; set `--panel-section-bleed` on the scroll container. */
export function PanelSectionDivider() {
  return (
    <hr className="-mx-[var(--panel-section-bleed,0.75rem)] border-0 border-t border-zinc-950/5" />
  )
}
