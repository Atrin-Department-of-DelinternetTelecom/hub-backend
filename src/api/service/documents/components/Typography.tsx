import { h } from 'nano-jsx';

export const BorderedText = ({ children }: { children: any }) => (
  <p
    style={{
      'border-radius': '0.5rem',
      border: '1px solid #d7deef',
      padding: '0.5rem',
    }}
  >
    {children}
  </p>
);

export const AvoidPageBreak = ({ children }: { children: any }) => (
  <div style={{ 'page-break-inside': 'avoid' }}>{children}</div>
);
