import { Shift } from '../backend';

interface ShiftBadgeProps {
  shift: Shift;
  size?: 'sm' | 'md';
}

export default function ShiftBadge({ shift, size = 'md' }: ShiftBadgeProps) {
  const isMorning = shift === Shift.morning;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide ${sizeClass} ${
        isMorning
          ? 'bg-amber text-charcoal-dark'
          : 'bg-red-accent text-white'
      }`}
    >
      <span>{isMorning ? '☀' : '🌙'}</span>
      {isMorning ? 'Morning' : 'Evening'}
    </span>
  );
}
