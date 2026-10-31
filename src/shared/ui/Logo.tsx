import { asset } from '@/shared/lib/asset';

export function Logo(props: { width?: string; height?: string; src?: string }) {
  const { width, height, src } = props;
  return (
    <img
      src={asset(src || 'logos/pango-marca-marron.svg')}
      alt="Pango Logo"
      width={width || '40'}
      height={height || '40'}
    />
  );
}
