import React from 'react';

export function SnapshotTime({value, fallback = 'Not reported'}: {value?: string; fallback?: string}) {
  if (!value) return <>{fallback}</>;
  const date = new Date(value);
  const readable = Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0,19).replace('T',' ') + ' UTC';
  return <time dateTime={value} title={value}>{readable}</time>;
}
