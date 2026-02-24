import { Role } from '../backend';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
}

export default function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const isManager = role === Role.manager;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide ${sizeClass} ${
        isManager
          ? 'bg-gold text-charcoal-dark'
          : 'bg-charcoal-light text-charcoal-muted'
      }`}
    >
      {isManager ? '★ Manager' : '● Staff'}
    </span>
  );
}
