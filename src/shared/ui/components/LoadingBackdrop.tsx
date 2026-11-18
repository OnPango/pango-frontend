import { asset } from '@/shared/lib/asset';
import { Leaf } from '../pangolin/leaves';
import '../pangolin/backdrop.css';

/**
 * The full-screen loading background: soft blobs in the corners that slowly change shape, a thin
 * curve, leaves swaying and a few drifting across. Decoration only. Place it first inside a
 * `relative` container, and lift the content above it (`relative`).
 */
export function LoadingBackdrop() {
  return (
    <div className="pbd" aria-hidden="true">
      <div className="pbd-blob pbd-top-right" />
      <div className="pbd-blob pbd-bottom-left" />
      <div className="pbd-blob pbd-copper" />
      <div className="pbd-blob pbd-bottom-right" />
      <svg
        className="pbd-curve"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2,100 C10,62 44,26 100,8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Leaf className="pbd-leaf pbd-leaf-top" />
      <Leaf className="pbd-leaf pbd-leaf-left" />
      <div className="pbd-drift pbd-drift-1">
        <Leaf />
      </div>
      <div className="pbd-drift pbd-drift-2">
        <Leaf />
      </div>
      <div className="pbd-drift pbd-drift-3">
        <Leaf />
      </div>
      {/* The brand in the top left corner: brown, or cream on the dark theme. */}
      <div className="pbd-brand">
        <img src={asset('logos/pango-logo-horizontal-marron.svg')} alt="" className="dark:hidden" />
        <img
          src={asset('logos/pango-logo-horizontal-crema.svg')}
          alt=""
          className="hidden dark:block"
        />
      </div>
    </div>
  );
}
