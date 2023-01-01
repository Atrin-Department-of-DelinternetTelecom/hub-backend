import { formatMoney, formatValue } from '../utils';
import { h } from 'nano-jsx';

export interface InitialFeeProps {
  name: string;
  price: number;
  start_date: Date | null;
  end_date: Date | null;
  installments: number;
  discount: number;
}

export const InitialFeeSection = (initialFee: InitialFeeProps) => (
  <div class="d-flex flex-column px-2">
    <h2 class="mb-1/5">Cuota inicial</h2>
    <div class="d-flex flex-wrap w-100">
      <Item
        className="w-1/3"
        primary={`Preu d'instal·lació`}
        secondary={formatMoney(initialFee.price) + ' € (+ IVA)'}
      />
      <Item
        className="w-50"
        primary={`Descompte d'instal·lació`}
        secondary={formatMoney(initialFee.discount) + ' €'}
      />
      <Item
        className="w-1/3"
        primary={`Data d'inici dels pagaments`}
        secondary={formatValue(initialFee.start_date)}
      />
      <Item
        className="w-1/3"
        primary={`Data de finalització dels pagaments`}
        secondary={formatValue(initialFee.end_date)}
      />
      <Item
        className="w-1/3"
        primary={`Fraccionat`}
        secondary={
          formatValue(initialFee.installments) +
          ` ${initialFee.installments === 1 ? 'mes' : 'mesos'}`
        }
      />
    </div>
  </div>
);

function Item({
  primary,
  secondary,
  className = '',
}: {
  primary?: string;
  secondary?: string;
  className?: string;
}) {
  return (
    <div class={'d-flex flex-column mb-1/5 ' + className}>
      <label class="text-gray">{primary}</label>
      <p>{secondary}</p>
    </div>
  );
}
