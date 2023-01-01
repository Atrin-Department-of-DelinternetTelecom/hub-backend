import { h } from 'nano-jsx';

export const Table = ({
  width,
  children,
}: {
  children: JSX.IntrinsicElements | JSX.IntrinsicElements[];
  width?: string;
}) => (
  <table
    style={{
      'border-radius': '0.5rem',
      border: '1px solid #d7deef',
      width: width ?? '100%',
    }}
  >
    {children}
  </table>
);

const tdAndThCommon = {
  'text-align': 'left',
  padding: '0.6rem 0.8rem',
  'font-size': '14px',
};

export const Th = ({ children }: { children: any }) => (
  <th
    style={{
      'border-bottom': '1px solid #d7deef',
      'font-weight': 'bold',
      ...tdAndThCommon,
    }}
  >
    {children}
  </th>
);

export const Td = ({
  children,
  weight,
  align,
}: {
  children?: any;
  weight?: string;
  align?: 'left' | 'center' | 'right';
}) => (
  <td
    style={{
      'border-bottom': '1px solid #d7deef',
      'font-weight': weight ?? 'bold',
      ...tdAndThCommon,
      'text-align': align ?? 'left',
    }}
  >
    {children}
  </td>
);

export const Tr = ({
  children,
}: {
  children: JSX.IntrinsicElements | JSX.IntrinsicElements[];
}) => <tr class="striped">{children}</tr>;
