import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function baseProps(props?: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true" as const,
    ...props
  };
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M6.8 5.2C7.3 4.7 8.1 4.7 8.7 5.1L10.8 6.5C11.4 6.9 11.7 7.7 11.4 8.3L10.6 10C11.4 11.7 12.7 13 14.4 13.8L16.1 13C16.7 12.7 17.5 13 17.9 13.6L19.3 15.7C19.7 16.3 19.7 17.1 19.2 17.6L18.2 18.6C17.4 19.4 16.2 19.7 15.1 19.3C11.2 17.9 8 14.7 6.6 10.8C6.2 9.7 6.5 8.5 7.3 7.7L6.8 5.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CatalogGridIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4.5" y="4.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="4.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4.5" y="13.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 4L18.5 7.5V16.5L12 20L5.5 16.5V7.5L12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 4V12M12 12L18.5 8M12 12L5.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 4V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 13H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DeliveryTruckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 7H14V15H4V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 10H18L20 12V15H14V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="8" cy="17.5" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 4L18 6.5V11.5C18 15.4 15.4 18.9 12 20C8.6 18.9 6 15.4 6 11.5V6.5L12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.5 11.8L11.2 13.5L14.8 9.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4.5" y="6.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 8L12 13L18.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CartStepIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M3.5 5H5.5L7.2 14C7.3 14.6 7.8 15 8.4 15H17.6C18.2 15 18.7 14.6 18.8 14L20.2 8.5H6.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="18" r="1.4" fill="currentColor" />
      <circle cx="17" cy="18" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M20 4L10.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M20 4L14 20L10.5 13.5L4 10L20 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CardIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 10H20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 14H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TelegramBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" {...props}>
      <rect width="80" height="80" rx="20" fill="white" />
      <g clipPath="url(#telegram-brand-clip)">
        <path
          d="M40 74.7825C59.2099 74.7825 74.7826 59.2098 74.7826 39.9999C74.7826 20.79 59.2099 5.21725 40 5.21725C20.7901 5.21725 5.21741 20.79 5.21741 39.9999C5.21741 59.2098 20.7901 74.7825 40 74.7825Z"
          fill="url(#telegram-brand-gradient)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20.9621 39.6327C31.1019 35.215 37.8634 32.3025 41.2465 30.8953C50.906 26.8776 52.9132 26.1797 54.2214 26.1566C54.5091 26.1516 55.1525 26.2229 55.5692 26.561C55.9211 26.8466 56.0179 27.2323 56.0643 27.503C56.1106 27.7737 56.1683 28.3904 56.1224 28.8723C55.599 34.3722 53.334 47.7192 52.1817 53.8792C51.6941 56.4858 50.7341 57.3597 49.8046 57.4452C47.7848 57.6311 46.2509 56.1104 44.2946 54.8279C41.2333 52.8212 39.5038 51.572 36.5323 49.6138C33.0981 47.3508 35.3243 46.1069 37.2814 44.0742C37.7936 43.5422 46.6933 35.4473 46.8656 34.7129C46.8871 34.6211 46.9071 34.2788 46.7037 34.098C46.5003 33.9172 46.2002 33.979 45.9836 34.0282C45.6765 34.0979 40.786 37.3303 31.312 43.7255C29.9239 44.6787 28.6665 45.1432 27.54 45.1188C26.2981 45.092 23.9091 44.4166 22.1332 43.8394C19.9549 43.1313 18.2237 42.7569 18.3744 41.5544C18.453 40.9281 19.3155 40.2875 20.9621 39.6327Z"
          fill="white"
        />
      </g>
      <defs>
        <linearGradient id="telegram-brand-gradient" x1="40" y1="5.21725" x2="40" y2="74.2665" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2AABEE" />
          <stop offset="1" stopColor="#229ED9" />
        </linearGradient>
        <clipPath id="telegram-brand-clip">
          <rect width="69.5652" height="69.5652" fill="white" transform="translate(5.21741 5.21725)" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function MaxBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" {...props}>
      <g clipPath="url(#max-brand-clip)">
        <path
          d="M60.0255 0H19.9745C8.94288 0 0 8.94288 0 19.9745V60.0255C0 71.0571 8.94288 80 19.9745 80H60.0255C71.0571 80 80 71.0571 80 60.0255V19.9745C80 8.94288 71.0571 0 60.0255 0Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M40.6569 70.2662C34.6563 70.2662 31.8678 69.3902 27.0206 65.8862C23.9546 69.8282 14.2458 72.9089 13.8223 67.6382C13.8223 63.6818 12.9463 60.3384 11.9535 56.6884C10.771 52.1916 9.42776 47.1838 9.42776 39.9278C9.42776 22.5977 23.6481 9.56 40.4963 9.56C57.3591 9.56 70.5721 23.2401 70.5721 40.0883C70.6286 56.676 57.2445 70.1778 40.6569 70.2662ZM40.9051 24.5394C32.7 24.1161 26.3052 29.7954 24.889 38.7014C23.721 46.0743 25.7942 55.0532 27.5608 55.5204C28.4076 55.7248 30.5392 54.002 31.8678 52.6734C34.0647 54.1911 36.623 55.1026 39.2846 55.316C47.7864 55.725 55.051 49.2525 55.6218 40.76C55.9541 32.2494 49.4082 25.0411 40.9051 24.5541V24.5394Z"
          fill="url(#max-brand-gradient)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M40.6569 70.2662C34.6563 70.2662 31.8678 69.3902 27.0206 65.8862C23.9546 69.8282 14.2458 72.9089 13.8223 67.6382C13.8223 63.6818 12.9463 60.3384 11.9535 56.6884C10.771 52.1916 9.42776 47.1838 9.42776 39.9278C9.42776 22.5977 23.6481 9.56 40.4963 9.56C57.3591 9.56 70.5721 23.2401 70.5721 40.0883C70.6286 56.676 57.2445 70.1778 40.6569 70.2662ZM40.9051 24.5394C32.7 24.1161 26.3052 29.7954 24.889 38.7014C23.721 46.0743 25.7942 55.0532 27.5608 55.5204C28.4076 55.7248 30.5392 54.002 31.8678 52.6734C34.0647 54.1911 36.623 55.1026 39.2846 55.316C47.7864 55.725 55.051 49.2525 55.6218 40.76C55.9541 32.2494 49.4082 25.0411 40.9051 24.5541V24.5394Z"
          fill="url(#max-brand-radial)"
        />
      </g>
      <defs>
        <linearGradient id="max-brand-gradient" x1="16.6335" y1="55.8614" x2="70.5346" y2="39.873" gradientUnits="userSpaceOnUse">
          <stop stopColor="#44CCFF" />
          <stop offset="0.662" stopColor="#5533EE" />
          <stop offset="1" stopColor="#9933DD" />
        </linearGradient>
        <radialGradient
          id="max-brand-radial"
          cx="0"
          cy="0"
          r="1"
          gradientTransform="matrix(46.3363 57.7025 -23.8782 19.0092 7.97309 -17.1776)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0000FF" />
          <stop offset="1" stopOpacity="0" />
        </radialGradient>
        <clipPath id="max-brand-clip">
          <rect width="80" height="80" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
