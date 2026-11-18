/** Leaves for the loading scenes, in `currentColor`. */

/** A single leaf, its tip towards the top right. */
export function Leaf({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2,22 C2,12 10,3 22,2 C22,13 13,22 2,22 Z" fill="currentColor" />
      <path
        d="M3,21 C8,16 13,11 18,6"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Three leaves sprouting from the ground, its base at the bottom center. */
export function Sprout({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 32"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <path d="M19,31 C11,30 4,23 2,13 C11,14 17,21 19,31 Z" />
        <path d="M21,31 C22,21 28,13 38,10 C38,21 31,29 21,31 Z" />
        <path d="M20,31 C16,24 17,15 21,7 C25,15 24,24 20,31 Z" opacity="0.85" />
      </g>
    </svg>
  );
}
