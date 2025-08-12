import { useResponsive } from '@/theme/hooks';

import NavVertical from './NavVertical';

export default function Nav() {
  const { screenMap } = useResponsive();
  if (screenMap.md) return <NavVertical />;
  return null;
}
