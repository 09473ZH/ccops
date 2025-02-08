import { Suspense } from 'react';

import { CircleLoading } from '@/components/Loading';

export default function Wrapper({ children }: any) {
  return <Suspense fallback={<CircleLoading />}>{children}</Suspense>;
}
