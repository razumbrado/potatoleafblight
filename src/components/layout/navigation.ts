import { BarChart3, BookOpen, History, Info, ScanLine, Settings, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Requires a signed-in user. */
  protected?: boolean;
  group: 'workspace' | 'learn' | 'account';
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/detect', label: 'Detection', icon: ScanLine, group: 'workspace' },
  { to: '/history', label: 'Scan History', icon: History, protected: true, group: 'workspace' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, protected: true, group: 'workspace' },
  { to: '/diseases', label: 'Disease Library', icon: BookOpen, group: 'learn' },
  { to: '/about', label: 'About', icon: Info, group: 'learn' },
  { to: '/settings', label: 'Settings', icon: Settings, protected: true, group: 'account' },
];

export const NAV_GROUPS: { key: NavItem['group']; label: string }[] = [
  { key: 'workspace', label: 'Workspace' },
  { key: 'learn', label: 'Learn' },
  { key: 'account', label: 'Account' },
];

/** Human-readable titles for breadcrumb segments. */
export const ROUTE_TITLES: Record<string, string> = {
  detect: 'Detection',
  results: 'Classification Result',
  history: 'Scan History',
  analytics: 'Analytics',
  diseases: 'Disease Library',
  about: 'About',
  settings: 'Settings',
};
