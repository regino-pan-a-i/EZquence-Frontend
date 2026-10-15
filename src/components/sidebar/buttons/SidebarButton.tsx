'use client';

import Link from 'next/link';
import Tooltip from '../../tooltip/Tooltip';

type Props = {
  label: string;
  icon: React.ReactNode;
  collapsed?: boolean;
  href?: string;
  active?: boolean;
};

export default function SidebarButton({
  label,
  icon,
  collapsed = false,
  href,
  active = false,
}: Props) {
  const content = (
    <div
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm hover:bg-background hover:bg-border ${
        active ? 'bg-border bg-surface' : ''
      }`}
    >
      <span className="shrink-0 h-6 w-6 flex items-center justify-center text-foreground">
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  );

  // Wrap Link/button with Tooltip when collapsed so users can see the label.
  if (href) {
    return (
      <Tooltip content={label} show={collapsed} position="right">
        <Link href={href} aria-label={label} className="block">
          {content}
        </Link>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={label} show={collapsed} position="right">
      <button type="button">{content}</button>
    </Tooltip>
  );
}
