import { h } from 'nano-jsx';

interface Props {
  name: string;
  dni: string;
  address: string;
  addressPostalCodeCodeName: string;
  addressCityCodeName: string;
  addressProvinceCodeName: string;
  phone1: string;
  email: string;
}

export const PersonalInfo = ({
  name,
  dni,
  address,
  addressPostalCodeCodeName,
  addressCityCodeName,
  addressProvinceCodeName,
  phone1,
  email,
}: Props) => (
  <div class="d-flex flex-column px-2">
    <h2 class="mb-1/5">Dades del titular</h2>
    <div class="d-flex flex-wrap w-100">
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">Nom del titular / Raó social</label>
        <p>{name}</p>
      </div>
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">DNI/NIE/NIF</label>
        <p>{dni}</p>
      </div>
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">Adreça de facturació</label>
        {address.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">Codi Postal</label>
        <p>{addressPostalCodeCodeName}</p>
      </div>
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">Localitat</label>
        <p>{addressCityCodeName}</p>
      </div>
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">Provincia</label>
        <p>{addressProvinceCodeName}</p>
      </div>
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">Telèfon 1</label>
        <p>{phone1}</p>
      </div>
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">Telèfon 2</label>
        <p>-</p>
      </div>
      <div class="d-flex flex-column w-1/3 mb-1/5">
        <label class="text-gray uppercase">E-mail</label>
        <p>{email}</p>
      </div>
    </div>
    <hr />
  </div>
);
