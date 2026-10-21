import type { PortGroup } from './types';
/** Combo media share a physical interface; optional modules never add built-in capacity. */
export function countBuiltInPorts(
  groups: PortGroup[],
  minimumSpeedMbps = 0,
): number {
  let count = 0;
  const combos = new Map<string, number>();
  for (const g of groups) {
    if (
      g.origin !== 'built-in' ||
      !g.speedsMbps.some((s) => s >= minimumSpeedMbps)
    )
      continue;
    if (g.medium === 'combo' && g.comboGroup)
      combos.set(
        g.comboGroup,
        Math.max(combos.get(g.comboGroup) ?? 0, g.count),
      );
    else count += g.count;
  }
  return count + [...combos.values()].reduce((a, b) => a + b, 0);
}
