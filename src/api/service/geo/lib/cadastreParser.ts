/* eslint-disable you-dont-need-lodash-underscore/get */
'use strict';
import _ from 'lodash';
import { Cadastre } from '../types';
import { safeObject, titleCase } from './helper';

export const parseCadastre = async (result: Cadastre) => {
  const features: any = {
    properties_count: safeObject(result.consulta_dnp.control[0].cudnp, '0'),
    buildings_count: safeObject(result.consulta_dnp.control[0].cucons, '0'),
    crops_count: safeObject(result.consulta_dnp.control[0].cucul, '0'),
  };

  //just properties
  if (result.consulta_dnp.lrcdnp) {
    features.properties = {};
    for (const { rc, dt } of result.consulta_dnp.lrcdnp[0].rcdnp) {
      let interior;
      if (dt[0].locs[0].lous) interior = dt[0].locs[0].lous[0];
      else interior = dt[0].locs[0].lors[0];

      if (!interior.lourb || !rc[0].car) continue;

      const { bq, es, pt, pu } = interior.lourb[0].loint[0];

      const block = safeObject(bq, 'default') ?? 'default';
      const stairway = safeObject(es, 'default') ?? 'default';
      const floor = safeObject(pt, 'default') ?? 'default';
      const door = safeObject(pu, 'default') ?? 'default';

      _.set(
        features.properties,
        `blocks[${block}].stairways[${stairway}].floors[${floor}].doors[${door}]`,
        {
          rc: String(safeObject(rc[0].pc1)) + String(safeObject(rc[0].pc2)),
          id: safeObject(rc[0].car),
        },
      );
    }
  }

  //properties & buildings & crops
  if (result.consulta_dnp.bico) {
    //properties
    if (result.consulta_dnp.bico[0].bi) {
      if (!features.properties) features.properties = {};
      const { pc1, pc2, car } = safeObject(
        result.consulta_dnp.bico[0].bi[0].idbi[0].rc,
      );

      let interior;
      if (result.consulta_dnp.bico[0].bi[0].dt[0].locs[0].lous)
        interior = result.consulta_dnp.bico[0].bi[0].dt[0].locs[0].lous[0];
      else interior = result.consulta_dnp.bico[0].bi[0].dt[0].locs[0].lors[0];

      const { es, pt, pu, bq } = interior.lourb[0].loint[0];

      const block = safeObject(bq, 'default');
      const stairway = safeObject(es, 'default');
      const floor = safeObject(pt, 'default');
      const door = safeObject(pu, 'default');

      _.set(
        features.properties,
        `blocks[${block}].stairways[${stairway}].floors[${floor}].doors[${door}]`,
        {
          rc: String(safeObject(pc1)) + String(safeObject(pc2)),
          id: safeObject(car),
        },
      );
    }

    //buildings
    if (
      result.consulta_dnp.bico[0].lcons &&
      result.consulta_dnp.bico[0].lcons[0].cons
    ) {
      features.buildings = {};
      for (const building of result.consulta_dnp.bico[0].lcons[0].cons) {
        const { loint } = building.dt[0].lourb[0];

        const use = titleCase(safeObject(building.lcd, 'undefined'));
        const block = safeObject(loint[0].bq, 'default');
        const stairway = safeObject(loint[0].es, 'default');
        const floor = safeObject(loint[0].pt, 'default');
        const door = safeObject(loint[0].pu, 'default');
        const surface = safeObject(building.dfcons[0].stl, 'undefined');

        _.set(
          features.buildings,
          `uses[${use}].blocks[${block}].stairways[${stairway}].floors[${floor}].doors[${door}]`,
          {
            surface,
          },
        );
      }
    }

    //crops
    if (result.consulta_dnp.bico[0].lspr) {
      features.crops = {};
      for (const crop of result.consulta_dnp.bico[0].lspr[0].spr) {
        const code = safeObject(crop.cspr);

        const qualification = titleCase(
          safeObject(crop.dspr[0].ccc, 'undefined'),
        );
        const denomination = titleCase(
          safeObject(crop.dspr[0].dcc, 'undefined'),
        );
        const production = titleCase(safeObject(crop.dspr[0].ip, 'undefined'));
        const surface = titleCase(safeObject(crop.dspr[0].ssp, 'undefined'));

        _.set(features.crops, `[${code}]`, {
          qualification,
          denomination,
          production,
          surface,
        });
      }
    }
  }

  return features;
};

export const streetTypeList = {
  AC: ['Acces', 'Acceso', 'Accés'],
  AG: ['added', 'Agregado', 'Agregat'],
  AL: ['Alameda', 'Albereda', 'Alameda'],
  AN: ['Walker', 'Andador', 'Caminador'],
  AR: ['Area', 'Area', 'Arrabal', 'Area, Raval'],
  AU: ['Highway', 'Autopista', 'Autopista'],
  AV: ['Avenue', 'Avenida', 'Avinguda'],
  AY: ['River stream', 'Arroyo', 'Rierol'],
  BJ: ['drop', 'Bajada', 'Baixada'],
  BL: ['Block', 'Bloque', 'Bloc'],
  BO: ['neighborhood', 'Barrio', 'Barri'],
  BQ: ['ravine', 'Barranquil', 'Barranquil'],
  BR: ['canyon', 'Barranco', 'Barranc'],
  CA: ['glen', 'Cañada', 'Caudal'],
  CG: ['School', 'Colegio', 'Cigarral', 'Col·legi', 'Cigarral'],
  CH: ['villa', 'Chalet', 'Xalet'],
  CI: ['Belt', 'Cinturón', 'Cinturó'],
  CJ: ['Alleyway', 'Callejón', 'Carreró'],
  CL: ['Street', 'Calle', 'Carrer'],
  CM: ['Way', 'Camino', 'Camí'],
  CN: ['cologne', 'Colonia', 'Colònia'],
  CO: ['Council', 'Concejo', 'Concejo'],
  CP: ['field', 'Campo', 'Camp'],
  CR: ['Road', 'Carretera', 'Carretera'],
  CS: ['farmhouse', 'Caserio', 'Caserio'],
  CT: ['cost', 'Cuesta', 'Cuesta'],
  CU: ['set', 'Conjunto', 'Conjunt'],
  CY: ['Caleya', 'Caleya', 'Caleya'],
  CZ: ['Tripe', 'Callizo', 'Carreró'],
  DE: ['behind', 'Detrás', 'Darrere'],
  DP: ['county council', 'Diputación', 'Diputació'],
  DS: ['Disseminated', 'Diseminado', 'Disseminat'],
  ED: ['building', 'Edificio', 'Edifici'],
  EM: ['extra-mural', 'Extramuro', 'Extramur'],
  EN: ['widening', 'Ensanche', 'Eixample'],
  EP: ['back', 'Espalda', 'Esquena'],
  ER: ['Extraradius', 'Extrarradio', 'Extraradi'],
  ES: ['Staircase', 'Escalinata', 'Escalinata'],
  EX: ['plain', 'Explanada', 'Esplanada'],
  FC: ['train', 'Ferrocarril', 'Ferrocarril'],
  FN: ['estate', 'Finca', 'Finca'],
  GL: ['traffic circle', 'Glorieta', 'Glorieta'],
  GR: ['Group', 'Grupo', 'Grup'],
  GV: ['Gran via', 'Gran Via', 'Gran Via'],
  HT: ['vegetable garden', 'Huerta', 'Horta'],
  JR: ['garden', 'Jardines', 'jardins'],
  LA: ['lake', 'Lago', 'Llac'],
  LD: ['hillside', 'Ladera', 'Vessant'],
  LG: ['place', 'Lugar', 'Lloc'],
  MA: ['boardwalk', 'Malecon', 'Malecon'],
  MC: ['Market', 'Mercado', 'Mercat'],
  ML: ['dock', 'Muelle', 'Moll'],
  MN: ['town', 'Municipio', 'Municipi'],
  MS: ['country house', 'Masia', 'Mas'],
  MT: ['mount', 'Monte', 'Muntanya'],
  MZ: ['block', 'Manzana', 'Illa'],
  PB: ['village', 'Poblado', 'Poblat'],
  PC: ['town square', 'Placeta', 'Placeta'],
  PD: ['party', 'Partida', 'Partida'],
  PI: ['individual', 'Particular', 'Particular'],
  PJ: ['passage', 'Pasaje', 'Passatge'],
  PL: ['industrial park', 'Polígono', 'Polígon'],
  PM: ['wasteland', 'Paramo', 'Paramo'],
  PQ: ['parish', 'Parroquia', 'Parque', 'Parròquia', 'Parc'],
  PR: ['Extension', 'Prolongación', 'Prolongació'],
  PS: ['walk', 'Paseo', 'Passeig'],
  PT: ['bigde', 'Puente', 'Pont'],
  PU: ['passageway', 'Pasadizo', 'Passadís'],
  PZ: ['square', 'Plaza', 'Plaça'],
  QT: ['state', 'Quinta', 'Finca'],
  RA: ['corner', 'Raconada', 'Raconada'],
  RB: ['boulevard', 'Rambla', 'Rambla'],
  RC: ['corner', 'Rincon', 'Racó'],
  RD: ['street round', 'Ronda', 'Ronda'],
  RM: ['street branch', 'Ramal', 'Ramal'],
  RP: ['ramp', 'Rampa', 'Rampa'],
  RR: ['riverside', 'Riera', 'Riera'],
  RU: ['Rua', 'Rua', 'Rua'],
  SA: ['Exit', 'Salida', 'Sortida'],
  SC: ['Sector', 'Sector', 'Sector'],
  SD: ['path', 'Senda', 'Senda'],
  SL: ['house plot', 'Solar', 'Solar'],
  SN: ['Hall', 'Salon', 'Saló'],
  SU: ['upload', 'Subida', 'Pujada'],
  TN: ['lands', 'Terrenos', 'Terrenys'],
  TO: ['torrent', 'Torrente', 'Torrent'],
  TR: ['crossroad', 'Travesia', 'Travesia'],
  UR: ['urbanization', 'Urbanización', 'Urbanització'],
  VA: ['valley', 'Valle', 'Vall'],
  VD: ['Viaduct', 'Viaducto', 'Viaducte'],
  VI: ['Via', 'Via', 'Via'],
  VL: ['road', 'Vial', 'Vial'],
  VR: ['sidewalk', 'Vereda', 'Sendera'],
  '': ['', '', ''],
  '.': ['', '', ''],
  'B.': ['', '', ''],
  AF: ['', '', ''],
  AP: ['', '', ''],
  AD: ['', '', ''],
  AT: ['', '', ''],
  BA: ['', '', ''],
  BD: ['', '', ''],
  BV: ['', '', ''],
  CE: ['', '', ''],
  CK: ['', '', ''],
  DM: ['', '', ''],
  DR: ['', '', ''],
  EC: ['', '', ''],
  GJ: ['', '', ''],
  GP: ['', '', ''],
  HF: ['', '', ''],
  HO: ['', '', ''],
  JD: ['', '', ''],
  LF: ['', '', ''],
  LU: ['', '', ''],
  MG: ['', '', ''],
  MD: ['', '', ''],
  MI: ['', '', ''],
  P: ['', '', ''],
  PA: ['', '', ''],
  PE: ['', '', ''],
  PG: ['', '', ''],
  PK: ['', '', ''],
  PP: ['', '', ''],
  PO: ['', '', ''],
  PY: ['', '', ''],
  PZA: ['', '', ''],
  RI: ['', '', ''],
  RT: ['', '', ''],
  RV: ['', '', ''],
  SB: ['', '', ''],
  SM: ['', '', ''],
  TV: ['', '', ''],
  UB: ['', '', ''],
  VC: ['', '', ''],
  VO: ['', '', ''],
  VV: ['', '', ''],
  ZN: ['', '', ''],
  ZO: ['', '', ''],
  VE: ['', '', ''],
  PV: ['', '', ''],
  QR: ['', '', ''],
};

export const getTypeOfName = (formated_type: string): string => {
  let type = '';
  for (const key in streetTypeList) {
    const isContained = streetTypeList[key].some((element) => {
      return element.toLowerCase() === formated_type.toLowerCase();
    });

    if (isContained) type = key;
  }
  return String(type).toUpperCase();
};

export const hasText = (characters: string, text: string) => {
  return new RegExp(String(characters).toLocaleLowerCase()).test(
    String(text).toLocaleLowerCase(),
  );
};
