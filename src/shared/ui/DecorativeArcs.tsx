export function SimpleArc(props: {
  width: string;
  height: string;
  viewBox: string;
  strokeColor?: string;
  strokeWidth?: string;
  fill?: string;
  cx?: string;
  cy?: string;
  r?: string;
}) {
  const { width, height, viewBox, strokeColor, strokeWidth, fill, cx, cy, r } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx={cx} cy={cy} r={r} stroke={strokeColor} strokeWidth={strokeWidth} fill={fill} />
    </svg>
  );
}

export function DoubleArc(props: {
  width: string;
  height: string;
  viewBox: string;
  strokeColor?: string[];
  strokeWidth?: string[];
  fill?: string[];
  cx?: string[];
  cy?: string[];
  r?: string[];
}) {
  const { width, height, viewBox, strokeColor, strokeWidth, fill, cx, cy, r } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="xMidYMax meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx={cx?.at(0)}
        cy={cy?.at(0)}
        r={r?.at(0)}
        fill={fill?.at(0)}
        stroke={strokeColor?.at(0)}
        strokeWidth={strokeWidth?.at(0)}
      />
      <circle
        cx={cx?.at(1)}
        cy={cy?.at(1)}
        r={r?.at(1)}
        fill={fill?.at(1)}
        stroke={strokeColor?.at(1)}
        strokeWidth={strokeWidth?.at(1)}
      />
    </svg>
  );
}
