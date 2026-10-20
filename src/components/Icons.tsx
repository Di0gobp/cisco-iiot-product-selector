export function Icon({
  name,
  size = 20,
}: {
  name:
    | 'search'
    | 'arrow'
    | 'external'
    | 'grid'
    | 'list'
    | 'check'
    | 'sliders'
    | 'close'
    | 'shield';
  size?: number;
}) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h15m-5-5 5 5-5 5" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6m0-6L10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    sliders: (
      <>
        <path d="M4 7h5m4 0h7M4 17h9m4 0h3" />
        <circle cx="11" cy="7" r="2" />
        <circle cx="15" cy="17" r="2" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function DeviceArt({
  type,
}: {
  type: 'router' | 'switch' | 'wireless';
}) {
  return (
    <svg
      className="device-art"
      viewBox="0 0 300 130"
      fill="none"
      aria-hidden="true"
    >
      <path d="M32 104h236M50 116h200" stroke="#c9d9db" strokeDasharray="3 5" />
      {type === 'switch' ? (
        <>
          <path
            d="m42 38 24-12h180l15 12v54l-18 12H57L42 91Z"
            fill="#c9d2d2"
            stroke="#60777c"
          />
          <path d="M42 38h219v54H42Z" fill="#f2f5f1" stroke="#60777c" />
          <path d="m42 38 24-12h180l15 12" fill="#e0e8e4" stroke="#60777c" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <g key={i}>
              <rect
                x={60 + i * 22}
                y="55"
                width="16"
                height="17"
                rx="1"
                fill="#324e55"
              />
              <path d={`M${64 + i * 22} 58v5h8v-5`} stroke="#a4b7b5" />
            </g>
          ))}
          <path d="M61 82h68" stroke="#afbebb" />{' '}
          <circle cx="244" cy="50" r="2" fill="#17785d" />
        </>
      ) : (
        <>
          <path
            d="m94 27 19-10h81l14 10v77l-15 9h-83l-16-9Z"
            fill="#c8d2d0"
            stroke="#60777c"
          />
          <rect
            x="94"
            y="27"
            width="114"
            height="77"
            rx="2"
            fill="#edf1ed"
            stroke="#60777c"
          />
          <path d="M109 35h85M109 41h85M109 47h85" stroke="#99adae" />
          {[0, 1].map((i) => (
            <g key={i}>
              <rect
                x={110 + i * 44}
                y="67"
                width="30"
                height="23"
                rx="1"
                fill="#334e55"
              />
              <path d={`M${116 + i * 44} 72v7h18v-7`} stroke="#a8b9b7" />
            </g>
          ))}
          <circle cx="110" cy="57" r="2" fill="#168169" />
          <circle cx="118" cy="57" r="2" fill="#b2c4bc" />
        </>
      )}
      <text
        x="150"
        y="128"
        textAnchor="middle"
        fill="#71888b"
        fontSize="8"
        letterSpacing="1.5"
      >
        CATEGORY ILLUSTRATION · NOT A PRODUCT IMAGE
      </text>
    </svg>
  );
}
