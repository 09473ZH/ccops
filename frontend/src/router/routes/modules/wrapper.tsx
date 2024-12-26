import { Suspense } from 'react';

import { CircleLoading } from '@/components/loading';

export default function Wrapper({ children }: any) {
  return <Suspense fallback={<CircleLoading />}>{children}</Suspense>;
}
