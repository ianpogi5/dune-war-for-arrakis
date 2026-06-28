// Converts the captured positions.json into src/engine/boardPositions.ts (committed).
import { AREAS } from '../src/engine/board.ts';
import { readFileSync, writeFileSync } from 'node:fs';
const pos = JSON.parse(readFileSync('positions.json', 'utf8'));
// stable order = board area order
const lines = Object.keys(AREAS).map((id) => {
  const [x, y] = pos[id];
  return `  ${JSON.stringify(id)}: [${x}, ${y}],`;
});
const out = `// AUTO-GENERATED from positions.json (capture tool) — do not edit by hand.
// Regenerate: npx tsx scripts/gen_positions.mjs
// Normalized (0..1) centre of each area on the full-board image (landscape, 4080x1884).

export const BOARD_ASPECT = ${(1884 / 4080).toFixed(4)}; // height / width of the source board image

export const AREA_POSITIONS: Record<string, readonly [number, number]> = {
${lines.join('\n')}
};
`;
writeFileSync('src/engine/boardPositions.ts', out);
console.log('Wrote src/engine/boardPositions.ts with', lines.length, 'positions');
