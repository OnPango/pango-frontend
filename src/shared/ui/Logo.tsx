export function Logo(props: { width?: string; height?: string }) {
  const { width, height } = props;
  return (
    <img
      src="./logos/pango-marca-marron.svg"
      alt="Pango Logo"
      width={width || '40'}
      height={height || '40'}
    />
  );
}
