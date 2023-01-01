import { h } from 'nano-jsx';

export const Observation = ({
  observation,
  comment,
}: {
  observation?: string | null;
  comment?: string | null;
}) => (
  <div class="signature d-flex flex-column justify-between border rounded p-1 w-100 h-100">
    <label class="uppercase">Observacions</label>
    <p>{observation ?? ''}</p>
    <p class="down">
      <small>{comment ?? ''} </small>
    </p>
  </div>
);
