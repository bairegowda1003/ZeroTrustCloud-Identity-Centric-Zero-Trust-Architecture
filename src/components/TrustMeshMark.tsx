import { useState } from 'react';

const asset = (width: number) => `/brand/trustmesh-mark-dark-${width}.webp`;
const candidates = [48, 96, 192, 288].map(width => `${asset(width)} ${width}w`).join(', ');

export function TrustMeshMark({ size = 38 }: { size?: number }) {
  const [fallback, setFallback] = useState(false);
  return <img className="trustmesh-mark" alt="" width={size} height={size}
    src={fallback ? '/trustmesh-core.svg' : asset(size > 48 ? 96 : 48)}
    srcSet={fallback ? undefined : candidates} sizes={`${size}px`}
    onError={() => setFallback(true)}/>;
}
