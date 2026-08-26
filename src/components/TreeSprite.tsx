import { memo, useId } from 'react';
import type { TreeSpecies } from '../types';
import type { GrowthStage } from '../game/economy';
import { ICONS } from '../icons';

interface Props {
  species: TreeSpecies;
  stage: GrowthStage;
}

const SCALE_BY_STAGE = [0.45, 0.65, 0.85, 1];

/** The "67" meme tree isn't a tree at all — just the digits, filled with the
 *  species' own foliage gradient so it still reads as "made of leaves"
 *  rather than plain text. */
function DigitSprite({ species, scale, gradientId }: { species: TreeSpecies; scale: number; gradientId: string }) {
  const [c1, c2] = species.foliage;
  return (
    <svg viewBox="0 0 100 110" className="tree-sprite" role="img" aria-label={species.name}>
      <ellipse cx="50" cy="102" rx={26 * scale} ry="5" className="tree-shadow" />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
      </defs>
      <text
        x="50"
        y={100 - 30 * scale}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize={40 * scale}
        fill={`url(#${gradientId})`}
      >
        67
      </text>
    </svg>
  );
}

/** koch_brat is a one-off promo tree with an actual photo instead of a
 *  procedurally-colored canopy — clipped to a circle so it reads as a
 *  "portrait ornament" sitting where the foliage normally goes, same
 *  shadow and scale-by-stage as every other tree. */
function PhotoSprite({ scale, clipId }: { scale: number; clipId: string }) {
  const r = 22 * scale;
  const cy = 100 - 46 * scale;
  return (
    <svg viewBox="0 0 100 110" className="tree-sprite" role="img" aria-label="Коч Брат">
      <ellipse cx="50" cy="102" rx={26 * scale} ry="5" className="tree-shadow" />
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy={cy} r={r} />
        </clipPath>
      </defs>
      <image
        href={ICONS.kochBrat}
        x={50 - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        preserveAspectRatio="xMidYMin slice"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}

function TreeSpriteImpl({ species, stage }: Props) {
  const scale = SCALE_BY_STAGE[stage];
  const [c1, c2] = species.foliage;
  const gradientId = useId();

  if (species.id === 'six_seven') {
    return <DigitSprite species={species} scale={scale} gradientId={gradientId} />;
  }

  if (species.id === 'koch_brat') {
    return <PhotoSprite scale={scale} clipId={gradientId} />;
  }

  return (
    <svg viewBox="0 0 100 110" className="tree-sprite" role="img" aria-label={species.name}>
      <ellipse cx="50" cy="102" rx={26 * scale} ry="5" className="tree-shadow" />
      {/* Static — sits behind the swaying canopy instead of on it, so the
          blur is a one-time paint instead of something the browser has to
          recompute on every frame the canopy rotates. */}
      <circle cx="50" cy={100 - 46 * scale} r={22 * scale} className="tree-glow" fill={c1} />
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
