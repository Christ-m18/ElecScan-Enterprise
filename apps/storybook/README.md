# Storybook

Catalogo visual del Design System ElecScan (ver `docs/08-ux-ui/01-design-system.md`).

Dev:

```
pnpm --filter @elecscan/storybook storybook
```

Build estatico:

```
pnpm --filter @elecscan/storybook build
```

En M0 se incluyen 3 stories de referencia:

- Tokens / Palette (MI550 Original)
- Components / KpiCard
- Components / PhaseValue

Los componentes restantes (WaveformChart, PhasorDiagram, HarmonicHistogram, MeterGauge, etc.) aterrizan en M2.
