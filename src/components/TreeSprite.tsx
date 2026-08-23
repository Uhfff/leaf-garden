import { memo } from 'react';
import type { TreeSpecies } from '../types';
import type { GrowthStage } from '../game/economy';

interface Props {
  species: TreeSpecies;
  stage: GrowthStage;
}

const SCALE_BY_STAGE = [0.45, 0.65, 0.85, 1];

function TreeSpriteImpl({ species, stage }: Props) {
  const scale = SCALE_BY_STAGE[stage];
  const [c1, c2] = species.foliage;

  return (
    <svg viewBox="0 0 100 110" className="tree-sprite" role="img" aria-label={species.name}>
      <ellipse cx="50" cy="102" rx={26 * scale} ry="5" className="tree-shadow" />
      <g className="tree-sway" style={{ transformOrigin: '50px 100px' }}>
        <rect
          x={50 - 4 * scale}
          y={100 - 46 * scale}
          width={8 * scale}
          height={46 * scale}
          rx={3}
          fill={species.trunk}
        />
        {stage >= 2 && (
          <rect
            x={50 - 14 * scale}
            y={100 - 40 * scale}
            width={10 * scale}
            height={8 * scale}
            rx={4}
            fill={species.trunk}
            transform={`rotate(-35 ${50 - 8 * scale} ${100 - 36 * scale})`}
          />
        )}
        <circle cx="50" cy={100 - 46 * scale} r={22 * scale} fill={c1} />
        <circle cx={50 - 16 * scale} cy={100 - 34 * scale} r={15 * scale} fill={c1} />
        <circle cx={50 + 16 * scale} cy={100 - 34 * scale} r={15 * scale} fill={c1} />
        <circle cx="50" cy={100 - 58 * scale} r={14 * scale} fill={c2} />
        <circle cx={50 - 10 * scale} cy={100 - 44 * scale} r={9 * scale} fill={c2} />
        <circle cx={50 + 12 * scale} cy={100 - 50 * scale} r={8 * scale} fill={c2} />
        {stage === 3 && <circle cx="50" cy={100 - 46 * scale} r={3} fill="#fff9d6" className="tree-sparkle" />}
      </g>
    </svg>
  );
}

// Stage only changes a few times over a tree's whole lifetime (age crosses one
// of 3 thresholds), unlike age itself which changes every tick — memoizing on
// (species, stage) means the SVG shapes are essentially never rebuilt.
export const TreeSprite = memo(TreeSpriteImpl);
