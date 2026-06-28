// Schematic, clickable board map. Areas are plotted from the captured normalized coordinates
// (boardPositions.ts) and colored by terrain — no copyrighted board art is shipped. Optional game
// state overlays legions / sietches / settlements / target so the player can see where things are.

import type { ReactNode } from 'react';
import { AREAS } from '../engine/board';
import type { Terrain } from '../engine/board';
import { AREA_POSITIONS, BOARD_ASPECT } from '../engine/boardPositions';
import { areaLabel } from '../engine/describeArea';
import type { GameState } from '../engine/state';

const W = 1000;
const H = Math.round(W * BOARD_ASPECT);

const TERRAIN_FILL: Record<Terrain, string> = {
  desert: '#e3c281',
  minor_erg: '#efdca2',
  plateau: '#bd7b3f',
  mountain: '#8c7259',
};

function fillFor(id: string): string {
  const a = AREAS[id];
  if (!a?.terrain) return '#999';
  if (a.deep) return '#c08a3a'; // deep desert — darker sand
  return TERRAIN_FILL[a.terrain];
}

const xy = (id: string): [number, number] => {
  const p = AREA_POSITIONS[id];
  return p ? [p[0] * W, p[1] * H] : [0, 0];
};

export interface BoardMapProps {
  /** Area to emphasize (gold pulse). */
  highlight?: string | null;
  /** Called when an area dot is clicked. */
  onSelect?: (id: string) => void;
  /** Optional game state to overlay pieces. */
  state?: GameState;
}

export function BoardMap({ highlight, onSelect, state }: BoardMapProps) {
  const ids = Object.keys(AREA_POSITIONS);

  // Index state by area for quick overlay lookups.
  const legionByArea = new Map<string, { h: boolean; a: boolean }>();
  for (const l of state?.legions ?? []) {
    const e = legionByArea.get(l.area) ?? { h: false, a: false };
    if (l.faction === 'harkonnen') e.h = true;
    else e.a = true;
    legionByArea.set(l.area, e);
  }
  const sietchByArea = new Map(state?.sietches.map((s) => [s.area, s]) ?? []);
  const settlementByArea = new Map(state?.settlements.map((s) => [s.area, s]) ?? []);
  const wormAreas = new Set([...(state?.wormsigns ?? []).map((w) => w.area), ...(state?.sandworms ?? []).map((w) => w.area)]);
  const target = state?.targetSietchId ?? null;

  return (
    <svg className="board-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Board map">
      <rect x={0} y={0} width={W} height={H} rx={10} fill="#f3e2bd" stroke="#d8c9aa" />

      {/* Area dots */}
      {ids.map((id) => {
        const [cx, cy] = xy(id);
        const a = AREAS[id];
        return (
          <g key={id} className="map-area" onClick={() => onSelect?.(id)} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
            <circle cx={cx} cy={cy} r={a?.name ? 7 : 6} fill={fillFor(id)} stroke="#6b5a3c" strokeWidth={0.8} />
          </g>
        );
      })}

      {/* Target sietch halo (under markers) */}
      {target && (() => {
        const [cx, cy] = xy(target);
        return <circle cx={cx} cy={cy} r={14} fill="none" stroke="#d4a017" strokeWidth={2.5} strokeDasharray="3 2" />;
      })()}

      {/* Sietch & settlement markers */}
      {ids.map((id) => {
        const [cx, cy] = xy(id);
        const si = sietchByArea.get(id);
        const st = settlementByArea.get(id);
        const out: ReactNode[] = [];
        if (si) {
          out.push(
            <g key={`si-${id}`} opacity={si.destroyed ? 0.4 : 1}>
              <path d={`M ${cx} ${cy - 11} L ${cx + 6} ${cy - 5} L ${cx - 6} ${cy - 5} Z`} fill={si.destroyed ? '#888' : '#2f5d50'} stroke="#1a2e29" strokeWidth={0.6} />
              {si.destroyed && <line x1={cx - 7} y1={cy - 12} x2={cx + 7} y2={cy - 3} stroke="#7a1d12" strokeWidth={1.5} />}
            </g>,
          );
        }
        if (st) {
          out.push(
            <g key={`st-${id}`} opacity={st.destroyed ? 0.4 : 1}>
              <rect x={cx - 5} y={cy - 12} width={10} height={8} rx={1.5} fill={st.destroyed ? '#888' : '#8a2c1f'} stroke="#3a120c" strokeWidth={0.6} />
              <text x={cx} y={cy - 6} fontSize={6} fill="#fff" textAnchor="middle" fontWeight={700}>{st.rank}</text>
            </g>,
          );
        }
        return out;
      })}

      {/* Legion markers (red = Harkonnen, green = Atreides) */}
      {[...legionByArea.entries()].map(([id, e]) => {
        const [cx, cy] = xy(id);
        return (
          <g key={`lg-${id}`}>
            {e.h && <circle cx={e.a ? cx - 4 : cx} cy={cy + 10} r={4.5} fill="#b3261e" stroke="#fff" strokeWidth={1} />}
            {e.a && <circle cx={e.h ? cx + 4 : cx} cy={cy + 10} r={4.5} fill="#2f7d3a" stroke="#fff" strokeWidth={1} />}
          </g>
        );
      })}

      {/* Wormsign / sandworm dots */}
      {[...wormAreas].map((id) => {
        const [cx, cy] = xy(id);
        return <circle key={`w-${id}`} cx={cx + 9} cy={cy - 2} r={2.6} fill="#5b3b1a" />;
      })}

      {/* Named-area labels */}
      {ids.filter((id) => AREAS[id]?.name).map((id) => {
        const [cx, cy] = xy(id);
        return (
          <text key={`t-${id}`} x={cx} y={cy + 16} fontSize={7} fill="#3a2c14" textAnchor="middle" className="map-label">
            {AREAS[id].name}
          </text>
        );
      })}

      {/* Highlight pulse (on top) */}
      {highlight && AREA_POSITIONS[highlight] && (() => {
        const [cx, cy] = xy(highlight);
        return (
          <g>
            <circle cx={cx} cy={cy} r={13} fill="none" stroke="#d4a017" strokeWidth={3}>
              <animate attributeName="r" values="11;16;11" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <text x={cx} y={cy - 18} fontSize={9} fontWeight={800} fill="#7a1d12" textAnchor="middle">{areaLabel(highlight)}</text>
          </g>
        );
      })()}
    </svg>
  );
}
