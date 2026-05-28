import * as React from "react";

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "d"> {
  size?: number;
  className?: string;
}

const Ico = ({ d, size = 14, className = "", ...props }: IconProps & { d: React.ReactNode }) => (
  <svg
    className={`sf-icon ${className}`}
    style={{ width: size, height: size }}
    viewBox="0 0 24 24"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.6"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {d}
  </svg>
);

export const Icons = {
  Plus: (p: IconProps) => <Ico {...p} d={<path d="M12 5v14M5 12h14" />} />,
  Search: (p: IconProps) => <Ico {...p} d={<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" /></>} />,
  Send: (p: IconProps) => <Ico {...p} d={<path d="m4 12 16-7-7 16-2-7-7-2Z" />} />,
  Sparkle: (p: IconProps) => <Ico {...p} d={<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />} />,
  Bolt: (p: IconProps) => <Ico {...p} d={<path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />} />,
  Arrow: (p: IconProps) => <Ico {...p} d={<><path d="M5 12h14M13 6l6 6-6 6" /></>} />,
  ArrowR: (p: IconProps) => <Ico {...p} d={<path d="m9 6 6 6-6 6" />} />,
  ArrowD: (p: IconProps) => <Ico {...p} d={<path d="m6 9 6 6 6-6" />} />,
  Check: (p: IconProps) => <Ico {...p} d={<path d="m5 12 4 4 10-10" />} />,
  X: (p: IconProps) => <Ico {...p} d={<path d="M6 6l12 12M18 6 6 18" />} />,
  Folder: (p: IconProps) => <Ico {...p} d={<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />} />,
  FolderO: (p: IconProps) => <Ico {...p} d={<><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M3 11h18" /></>} />,
  File: (p: IconProps) => <Ico {...p} d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6" /></>} />,
  Code: (p: IconProps) => <Ico {...p} d={<><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" /></>} />,
  Terminal: (p: IconProps) => <Ico {...p} d={<><path d="m5 8 4 4-4 4M12 16h7" /><rect x="2.5" y="4.5" width="19" height="15" rx="2" /></>} />,
  Branch: (p: IconProps) => <Ico {...p} d={<><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 7v10M6 14a6 6 0 0 0 6-6h4" /></>} />,
  Database: (p: IconProps) => <Ico {...p} d={<><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>} />,
  Server: (p: IconProps) => <Ico {...p} d={<><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01" /></>} />,
  Cloud: (p: IconProps) => <Ico {...p} d={<path d="M7 18a5 5 0 0 1-1-9.9 7 7 0 0 1 13.5 2.5A4 4 0 0 1 18 18H7Z" />} />,
  Lock: (p: IconProps) => <Ico {...p} d={<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>} />,
  Key: (p: IconProps) => <Ico {...p} d={<><circle cx="8" cy="14" r="4" /><path d="m11 11 9-9M16 6l3 3M14 8l3 3" /></>} />,
  Settings: (p: IconProps) => <Ico {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>} />,
  Bell: (p: IconProps) => <Ico {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8Z" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />,
  User: (p: IconProps) => <Ico {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />,
  Home: (p: IconProps) => <Ico {...p} d={<><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /></>} />,
  Layers: (p: IconProps) => <Ico {...p} d={<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5M3 18l9 5 9-5" /></>} />,
  Box: (p: IconProps) => <Ico {...p} d={<><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v10" /></>} />,
  Rocket: (p: IconProps) => <Ico {...p} d={<path d="M5 19a3 3 0 0 0 4 0c2-2 4-8 4-8s-6 2-8 4a3 3 0 0 0 0 4Zm8-12s4-2 7-2c0 3-2 7-2 7l-5 5-5-5 5-5Zm3 3h.01" />} />,
  Stop: (p: IconProps) => <Ico {...p} d={<rect x="6" y="6" width="12" height="12" rx="1" />} />,
  Play: (p: IconProps) => <Ico {...p} d={<path d="m6 4 14 8-14 8V4Z" />} />,
  Refresh: (p: IconProps) => <Ico {...p} d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>} />,
  More: (p: IconProps) => <Ico {...p} d={<><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></>} />,
  Chev: (p: IconProps) => <Ico {...p} d={<path d="m9 6 6 6-6 6" />} />,
  ChevD: (p: IconProps) => <Ico {...p} d={<path d="m6 9 6 6 6-6" />} />,
  Cmd: (p: IconProps) => <Ico {...p} d={<path d="M9 6H6a3 3 0 1 0 3 3V6Zm0 0v12m0 0h3a3 3 0 1 0-3-3m0 0H6a3 3 0 1 0 3 3m6-12h3a3 3 0 1 1-3 3V6Zm0 12v-3m0 0a3 3 0 1 0 3-3h-3v3Z" />} />,
  Logo: (p: IconProps) => <Ico {...p} d={<><path d="M4 8 12 4l8 4-8 4-8-4Z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></>} />,
  Github: (p: IconProps) => <Ico {...p} d={<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />} />,
  Bug: (p: IconProps) => <Ico {...p} d={<><path d="M8 6a4 4 0 0 1 8 0v2H8V6Z" /><path d="M5 13c0-3 3-5 7-5s7 2 7 5v3a7 7 0 1 1-14 0v-3Z" /><path d="M5 13H2M22 13h-3M5 17H2M22 17h-3M5 21l-1 1M19 21l1 1" /></>} />,
  Eye: (p: IconProps) => <Ico {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>} />,
  Copy: (p: IconProps) => <Ico {...p} d={<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>} />,
  Download: (p: IconProps) => <Ico {...p} d={<><path d="M12 4v12m0 0-5-5m5 5 5-5" /><path d="M4 20h16" /></>} />,
  Zap: (p: IconProps) => <Ico {...p} d={<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />} />,
  Filter: (p: IconProps) => <Ico {...p} d={<path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />} />,
  Grid: (p: IconProps) => <Ico {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>} />,
  List: (p: IconProps) => <Ico {...p} d={<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>} />,
  Globe: (p: IconProps) => <Ico {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" /></>} />,
  Info: (p: IconProps) => <Ico {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></>} />,
  AlertTri: (p: IconProps) => <Ico {...p} d={<><path d="M10.3 3.5 2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v5M12 17h.01" /></>} />,
  Inbox: (p: IconProps) => <Ico {...p} d={<><path d="M22 12h-7l-2 3h-2l-2-3H2" /><path d="M5 5h14l3 7v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7l3-7Z" /></>} />,
  Compass: (p: IconProps) => <Ico {...p} d={<><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6 6-2Z" /></>} />,
  Hash: (p: IconProps) => <Ico {...p} d={<path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18" />} />,
  Cube: (p: IconProps) => <Ico {...p} d={<><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v10" /></>} />,
  Power: (p: IconProps) => <Ico {...p} d={<><path d="M12 3v9" /><path d="M5.6 7.6a8 8 0 1 0 12.8 0" /></>} />,
  Star: (p: IconProps) => <Ico {...p} d={<path d="m12 3 2.7 6 6.3.6-4.8 4.3 1.5 6.1L12 17l-5.7 3 1.5-6.1L3 9.6 9.3 9 12 3Z" />} />,
  Spinner: (p: IconProps) => <Ico {...p} d={<><path d="M12 3v3M12 18v3M5.6 5.6 7.7 7.7M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>} />
};
