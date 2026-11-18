import { useId } from 'react';

/** The ball's copper, the same on both themes. */
const COPPER = '#c8643a';

/**
 * The lines between the coils, cut out of the ball: the back sweeping in from the top, the outer
 * coil down the left, the neck running into the head and the snout, the ear, and the front leg.
 */
const GROOVES = [
  'M76,13.5 C74.3,13.6 69.5,13.9 66,14.2 C62.5,14.5 58.6,14.5 55,15.5 C51.4,16.5 47.5,17.8 44.5,20 C41.5,22.2 38.8,25.2 37,28.5 C35.3,31.8 34.2,36.3 34,40 C33.8,43.7 34.6,47.1 36,50.5 C37.4,53.9 41.4,58.8 42.5,60.5',
  'M18.5,21 C18.4,23.6 17.2,31.6 17.6,36.5 C18,41.4 18.9,46.2 20.8,50.4 C22.7,54.6 25.8,58.8 29,61.5 C32.2,64.2 36.6,65.8 40,66.6 C43.4,67.4 46.8,67 49.5,66.6 C52.2,66.2 54.9,64.4 56,64',
  'M41.5,45.5 C42.2,44.7 43.8,41.7 45.5,40.5 C47.3,39.3 49.6,38.6 52,38.2 C54.4,37.8 57.7,37.8 60,38 C62.3,38.2 64.2,39 66,39.6 C67.8,40.2 69.4,41 71,41.6 C72.6,42.2 74.2,42.5 75.6,43.4 C77,44.3 78.3,45.5 79.6,47 C80.9,48.5 82.2,51 83.2,52.6 C84.2,54.2 84.9,55.6 85.8,56.4 C86.7,57.2 87.6,57.5 88.6,57.4 C89.6,57.3 91,55.9 91.5,55.6',
  'M66.4,39.8 C66.4,39.4 66.1,37.9 66.4,37.2 C66.7,36.5 67.6,35.7 68.4,35.4 C69.2,35.1 70.6,35.6 71,35.6',
  'M56.8,44.6 C57.8,45 61,45.5 63,46.8 C65,48.1 67.1,50.2 68.6,52.6 C70.1,55.1 71.6,58.2 72.2,61.5 C72.8,64.8 73.4,69.1 72.2,72.6 C71.1,76.1 68.6,79.5 65.3,82.4 C62,85.3 55,88.4 52.1,90 C49.2,91.6 48.7,91.7 48,92',
];

/**
 * A pangolin rolled up tight, like the logo filled in: a copper ball with the lines between its
 * coils, the tip of the tail in the middle and the head on the right. The lines and the eye are cut
 * out (a mask), so whatever is behind shows through them on either theme. The parent rolls it.
 */
export function PangolinBall({ className }: { className?: string }) {
  // One mask per instance: two loaders on a page must not share the id.
  const mask = `pango-ball-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <svg
      viewBox="10 10 80 80"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id={mask}>
          <rect x="0" y="0" width="100" height="100" fill="#fff" />
          <g
            fill="none"
            stroke="#000"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {GROOVES.map((d) => (
              <path key={d} d={d} />
            ))}
            <circle cx="50" cy="52.5" r="10.4" />
          </g>
          <ellipse cx="79.6" cy="42" rx="1.7" ry="1.35" fill="#000" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="40" fill={COPPER} mask={`url(#${mask})`} />
    </svg>
  );
}
