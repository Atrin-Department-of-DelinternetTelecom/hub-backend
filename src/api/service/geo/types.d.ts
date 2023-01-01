export interface Province {
  consulta_provinciero: {
    control: {
      cuprov: [number];
    };
    provinciero: [
      {
        prov: {
          cpine: [string];
          np: [string];
        }[];
      },
    ];
  };
}
// end of province interface type
// city interfaces type
export interface CityControl {
  cumun: number[];
}

export interface Locat {
  cd: string[];
  cmc: string[];
}

export interface LoineCity {
  cp: string[];
  cm: string[];
}

export interface Muni {
  nm: string[];
  locat: Locat[];
  loine: LoineCity[];
}

export interface Municipiero {
  muni: Muni[];
}

export interface ConsultaMunicipiero {
  control: CityControl;
  municipiero: Municipiero[];
}

export interface City {
  consulta_municipiero: ConsultaMunicipiero;
}

// end of city interfaces type
// street interfaces type
export interface StreetControl {
  cuca: number[];
}

export interface LoineStreet {
  cp: string[];
  cm: string[];
}

export interface Dir {
  cv: string[];
  tv: string[];
  nv: string[];
}

export interface Calle {
  loine: LoineStreet[];
  dir: Dir[];
}

export interface Callejero {
  calle: Calle[];
}

export interface ConsultaCallejero {
  control: StreetControl;
  callejero: Callejero[];
}

export interface Street {
  consulta_callejero: ConsultaCallejero;
}

// end of street interfaces type
// dynamiclly cadastre interfaces type
export interface CadastreControl {
  cudnp: [string];
  cucons: [string];
  cucul: [string];
}

export interface Rc {
  pc1: [number];
  pc2: [string];
  car: [number];
  cc1: [string];
  cc2: [string];
}

export interface Loine {
  cp: number;
  cm: number;
}

export interface Dir {
  cv: number;
  tv: string;
  nv: string;
  pnp: number;
  snp: number;
}

export interface Loint {
  es: [string] | [number];
  pt: [string] | [number];
  pu: [string] | [number];
  bq?: [string] | [number];
}

export interface Lourb {
  dir: Dir;
  loint: Loint;
  dp: number;
  dm: number;
}

export interface Lous {
  lourb: Lourb;
}

export interface Locs {
  lous: Lous;
  lors: Lous;
}

export interface Dt {
  loine: Loine;
  cmc: number;
  np: string;
  nm: string;
  locs: Locs;
  lourb: Lourb;
}

export interface Rcdnp {
  rc: Rc;
  dt: Dt;
}

export interface Lrcdnp {
  rcdnp: Rcdnp[];
}

export interface Idbi {
  cn: string;
  rc: Rc;
}

export interface Debi {
  luso: string;
  sfc: number;
  cpt: number;
  ant: number;
}

export interface Bi {
  idbi: Idbi;
  dt: Dt;
  ldt: string;
  debi: Debi;
}

export interface Dfcons {
  stl: number;
}

export interface Con {
  lcd: string | number;
  dt: Dt;
  dfcons: Dfcons;
}

export interface Lcons {
  cons: Con[];
}
export interface Dspr {
  ccc: string | number;
  dcc: string | number;
  ip: string | number;
  ssp: string | number;
}
export interface Spr {
  cspr: string;
  dspr: Dspr;
}
export interface Lspr {
  spr: Spr[];
}
export interface Bico {
  bi: Bi;
  lcons: [Lcons];
  lspr: [Lspr];
}

export type ConsultaDnp = {
  control: CadastreControl;
  lrcdnp: [Lrcdnp];
  bico: [Bico];
};

export interface Cadastre {
  consulta_dnp: ConsultaDnp;
}
