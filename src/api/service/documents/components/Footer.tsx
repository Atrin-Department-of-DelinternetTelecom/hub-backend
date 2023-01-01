import { Fragment, h } from 'nano-jsx';
import * as Logo from './Icons';

export const Footer = ({ children }: { children: any }) => {
  return <footer class="mt-1">{children}</footer>;
};

export const DelinternetInfo = () => (
  <div
    class="d-flex px-2 align-center justify-between bg-primary text-white"
    style={{ background: '#b9d205', padding: '1rem 1.5rem' }}
  >
    <span class="d-flex align-center">
      <Logo.Location />
      <span class="px-1/2 bolder">Dirección</span>
      <small>Plaça Mercat La Cava 1 Local Delinternet - Deltebre - 43580</small>
    </span>
    <span class="divider sm"></span>
    <span class="d-flex align-center">
      <Logo.Email />
      <span class="px-1/2 bolder">Email</span>
      <small>info@delinternet.com</small>
    </span>
    <span class="divider sm"></span>
    <span class="d-flex align-center">
      <Logo.Phone />
      <span class="px-1/2 bolder">Telèfon</span>
      <small>877-990-500</small>
    </span>
  </div>
);
