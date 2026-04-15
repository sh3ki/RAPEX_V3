import { type ReactNode } from 'react';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

export interface TabOption {
  value: string;
  label: string;
  count?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}
