import { ListItemIcon, Menu, MenuItem } from '@mui/material';
import Image from 'next/image';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import Link from 'next/link';
import {
  BusinessCenterSharp,
  BusinessSharp,
  RssFeed,
} from '@mui/icons-material';

export default function HeaderLinks({ anchorEl, setAnchorEl, open }) {
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Menu
      disableScrollLock
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
    >
      <MenuItem component={Link} href='/' onClick={handleClose}>
        <ListItemIcon>
          <HomeOutlinedIcon />
        </ListItemIcon>
        Home
      </MenuItem>
      <MenuItem
        component={Link}
        href='https://www.upsers.com/us/en/welcome.html'
        onClick={handleClose}
      >
        <ListItemIcon>
          <Image src='/ups_logo.png' height={25} width={22} alt='UPS Logo' />
        </ListItemIcon>
        UPSers.com
      </MenuItem>
      <MenuItem
        component={Link}
        href='https://www.aramark-uniform.com/ups/'
        onClick={handleClose}
      >
        <ListItemIcon>
          <Image src='/socks.jpg' height={25} width={22} alt='UPS Logo' />
        </ListItemIcon>
        UPS Socks
      </MenuItem>
      <MenuItem component={Link} href='/recommended' onClick={handleClose}>
        <ListItemIcon>
          <ShoppingCartOutlinedIcon />
        </ListItemIcon>
        Purchases
      </MenuItem>
      <MenuItem component={Link} href='/blog' onClick={handleClose}>
        <ListItemIcon>
          <RssFeed />
        </ListItemIcon>
        Blog
      </MenuItem>
      <MenuItem component={Link} href='/jobs' onClick={handleClose}>
        <ListItemIcon>
          <BusinessCenterSharp />
        </ListItemIcon>
        Jobs
      </MenuItem>
    </Menu>
  );
}
