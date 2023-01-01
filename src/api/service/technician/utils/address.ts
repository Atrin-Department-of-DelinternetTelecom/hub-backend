import { coalesce } from '@api/utils/knex';
import { pascalCase } from 'case-anything';
import { compile } from 'handlebars';

const fields = [
  'region',
  'province',
  'provinceCode',
  'provinceCodeName',
  'city',
  'cityCode',
  'cityCodename',
  'postalCode',
  'postalCodeCode',
  'postalCodeCodeName',
  'street',
  'streetCode',
  'streetCodeName',
  'streetTypeCode',
  'streetTypeCodeName',
  'number',
  'numberCode',
  'numberCodeName',
  'floor',
  'floorCode',
  'floorCodeName',
  'building',
  'buildingCode',
  'buildingCodeName',
  'door',
  'doorCode',
  'doorCodeName',
  'stairway',
  'stairwayCode',
  'stairwayCodeName',
  'lat',
  'lng',
  'mapUrl',
] as const;

type PossibleAddressField = (typeof fields)[number];

export type Address = {
  [key in PossibleAddressField]?: string;
};

type ObjectWithAddress = {
  [key: string]: any;
} & {
  address: Partial<Address>;
};

const fieldsWithPrefix = fields.map((f) => ({
  value: f as PossibleAddressField,
  withPrefix: `address${pascalCase(f)}`,
}));

export const mapAddressObject = (obj: ObjectWithAddress) => {
  const rest: Omit<ObjectWithAddress, 'address'> = { ...obj };
  const address: Address = {};

  for (const field of fields) {
    if (field in obj) {
      address[field] = obj[field] as string;
      delete rest[field];
    }
  }

  return { ...rest, address };
};
export const getAddressWithReference = (reference?: string) => {
  return fieldsWithPrefix.map(
    (fieldObect) =>
      `${reference ? `${reference}.` : ''}${fieldObect.withPrefix}`,
  );
};

export const coalesceAddressFieldsWithTwoReference = (
  firstRef: string,
  secondRef: string,
  withPrefix?: boolean,
) => {
  const addressFieldsOfFirstRef = getAddressWithReference(firstRef);
  const addressFieldsOfSecondRef = getAddressWithReference(secondRef);

  return fieldsWithPrefix.map((fieldObject, index) =>
    coalesce(
      [addressFieldsOfFirstRef[index], addressFieldsOfSecondRef[index]],
      { as: withPrefix ? fieldObject.withPrefix : fieldObject.value },
    ),
  );
};

const template =
  compile<Address>(`{{{street}}}{{#if number}}, {{{number}}}{{/if}}{{#if floor}} {{{floor}}}º{{#if door}}-{{/if}}{{/if}}{{#if door}}{{{door}}}ª {{/if}}
{{#if building}}building {{{building}}}{{#if stairway}},{{/if}}{{/if}}{{#if stairway}} stairway {{{stairway}}}{{/if}}
{{#if postalCode}}{{{postalCode}}} {{/if}}{{{city}}}
{{{province}}}`);

export function merge(
  source1: Record<string, any>,
  source2: Record<string, any>,
): Address {
  const result: Address = {};
  for (const { value, withPrefix } of fieldsWithPrefix) {
    const v1 = source1[withPrefix];
    const v2 = source2[withPrefix];
    result[value] = v1 || v2 || null;
  }

  return result;
}

export function format(address: Address) {
  return template(address);
}
