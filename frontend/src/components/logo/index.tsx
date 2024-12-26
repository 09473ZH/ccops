import { NavLink } from 'react-router-dom';

import LoginBgImg from '@/assets/images/logo.ico';

interface Props {
  size?: number | string;
}
function Logo({ size = 50 }: Props) {
  return (
    <NavLink to="/">
      <img src={LoginBgImg} alt="" style={{ width: size, height: size }} />
    </NavLink>
  );
}

export default Logo;
