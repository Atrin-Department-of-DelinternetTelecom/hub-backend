import { format } from '@api/service/documents/utils';
import { h } from 'nano-jsx';

const styles = {
  margin: '0 auto',
  width: 'auto',
  height: '140px',
  padding: '0',
};

export const Signature = ({
  label,
  signature,
  date,
}: {
  label: string;
  signature: Buffer | null;
  date?: Date | null;
}) => (
  <div
    class="signature relative d-flex flex-column justify-between border rounded p-1 w-100 h-100"
    style="overflow: hidden"
  >
    <label class="uppercase absolute" style="top: 1rem; left: 1rem;">
      {label}
    </label>

    {!signature ? (
      <div style={styles}></div>
    ) : (
      <img
        style={styles}
        src={`data:image/png;base64,${signature!.toString('base64')}`}
      />
    )}

    <p class="down absolute" style="bottom: 1rem; left: 1rem;">
      {format(date)}
    </p>
  </div>
);

/**
 * This component receives a list of signatures as children and renders them in a single row.
 */
export const SignatureContainer = ({ children }: { children: any }) => {
  const signatures = Array.isArray(children) ? children : [children];

  const wrapped = signatures.map((s) => (
    <div class="px-1/2 d-flex" style={{ width: 100 / signatures.length + '%' }}>
      {s}
    </div>
  ));

  return <div class="d-flex justify-between px-2 pb-1">{wrapped}</div>;
};
