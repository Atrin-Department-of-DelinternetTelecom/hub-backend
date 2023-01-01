import { Meilisearch, Sequelize } from '@lib/search';
import {
  createCatch,
  findAndDelete,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
  getAllEntities,
} from '@utils/request-handler';
import { respondOK, respondSuccessWithPagination } from '@utils/response';

import { Builder } from '@del-internet/support-search';
import { Country } from '@api/models/intranet/intranet_global_countries';

const Searchable = class extends Sequelize {
  /**
   * Get the indexable data object for the model.
   *
   * @return object
   */
  toSearchableObject() {
    return {
      ...super.toSearchableObject(),
      name: localizedNames(this.model.isoCode),
    };
  }
};

export const deleteCountriesId = async (id: number) => {
  return findAndDelete(id, Country);
};

export const destroyCountriesId = async function (id: number) {
  return findAndDeleteIntranet(id, Country);
};

export const getCountries = async function (query: Record<string, string>) {
  return getAllEntities(query, Country);
};

export const syncCountries = async () => {
  const countries = await Country.findAll({});
  const searchable = new Searchable(new Country());
  await Meilisearch.deleteIndex(searchable.searchableAs());
  await Meilisearch.createIndex(searchable.searchableAs());
  await Meilisearch.client.index(searchable.searchableAs()).updateSettings({
    displayedAttributes: ['*'],
    searchableAttributes: ['*'],
    filterableAttributes: ['*'],
    sortableAttributes: ['id', 'isoCode', 'name', 'currencyCode'],
    rankingRules: [
      'exactness',
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
    ],
    stopWords: [],
    synonyms: {},
    distinctAttribute: null,
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 8,
        twoTypos: 12,
      },
      disableOnWords: [],
      disableOnAttributes: [],
    },
    faceting: {
      maxValuesPerFacet: 100,
    },
    pagination: {
      maxTotalHits: countries.length * 2,
    },
  });

  await Meilisearch.update(countries.map((country) => new Searchable(country)));

  return respondOK('Search records updated!');
};

export const getCountriesId = async (id: number) => {
  return findAndGet(id, Country);
};

export const postCountries = async function (
  body: Record<string, any>,
  creator_id: number,
) {
  body.creator_id = creator_id;
  return createCatch(body, Country);
};

export const putCountriesId = async (
  id: number,
  body: Record<string, unknown>,
) => {
  return findAndUpdate(id, body, Country);
};

export const localizedNames = (isoCode: string) => {
  return {
    ca: isoCode,
    es: isoCode,
    en: isoCode,
    ...(names[isoCode] ?? {}),
  };
};

const names: Record<string, Record<string, string>> = {
  AD: {
    ca: 'Andorra',
    es: 'Andorra',
    en: 'Andorra',
  },
  AE: {
    ca: 'Emirats Àrabs Units',
    es: 'Emiratos Árabes Unidos',
    en: 'United Arab Emirates',
  },
  AF: {
    ca: 'Afganistan',
    es: 'Afganistán',
    en: 'Afghanistan',
  },
  AG: {
    ca: 'Antigua i Barbuda',
    es: 'Antigua y Barbuda',
    en: 'Antigua and Barbuda',
  },
  AI: {
    ca: 'Anguilla',
    es: 'anguila',
    en: 'Anguilla',
  },
  AL: {
    ca: 'Albània',
    es: 'Albania',
    en: 'Albania',
  },
  AM: {
    ca: 'Armènia',
    es: 'Armenia',
    en: 'Armenia',
  },
  AO: {
    ca: 'Angola',
    es: 'angola',
    en: 'Angola',
  },
  AQ: {
    ca: 'Antàrtida',
    es: 'Antártida',
    en: 'Antarctica',
  },
  AR: {
    ca: 'Argentina',
    es: 'Argentina',
    en: 'Argentina',
  },
  AS: {
    ca: 'Samoa Americana',
    es: 'Samoa Americana',
    en: 'American Samoa',
  },
  AT: {
    ca: 'Àustria',
    es: 'Austria',
    en: 'Austria',
  },
  AU: {
    ca: 'Austràlia',
    es: 'Australia',
    en: 'Australia',
  },
  AW: {
    ca: 'Aruba',
    es: 'Aruba',
    en: 'Aruba',
  },
  AX: {
    ca: 'Åland',
    es: 'Una tierra',
    en: 'Åland',
  },
  AZ: {
    ca: 'Azerbaidjan',
    es: 'Azerbaiyán',
    en: 'Azerbaijan',
  },
  BA: {
    ca: 'Bòsnia i Hercegovina',
    es: 'Bosnia y Herzegovina',
    en: 'Bosnia and Herzegovina',
  },
  BB: {
    ca: 'Barbados',
    es: 'barbados',
    en: 'Barbados',
  },
  BD: {
    ca: 'Bangla Desh',
    es: 'bangladesh',
    en: 'Bangladesh',
  },
  BE: {
    ca: 'Bèlgica',
    es: 'Bélgica',
    en: 'Belgium',
  },
  BF: {
    ca: 'Burkina Faso',
    es: 'Burkina Faso',
    en: 'Burkina Faso',
  },
  BG: {
    ca: 'Bulgària',
    es: 'Bulgaria',
    en: 'Bulgaria',
  },
  BH: {
    ca: 'Bahrain',
    es: 'Baréin',
    en: 'Bahrain',
  },
  BI: {
    ca: 'Burundi',
    es: 'Burundi',
    en: 'Burundi',
  },
  BJ: {
    ca: 'Benín',
    es: 'Benín',
    en: 'Benin',
  },
  BL: {
    ca: 'Sant Bartomeu',
    es: 'San Bartolomé',
    en: 'Saint Barthélemy',
  },
  BM: {
    ca: 'Bermudes',
    es: 'islas Bermudas',
    en: 'Bermuda',
  },
  BN: {
    ca: 'Brunei',
    es: 'Brunéi',
    en: 'Brunei',
  },
  BO: {
    ca: 'Bolívia',
    es: 'Bolivia',
    en: 'Bolivia',
  },
  BQ: {
    ca: 'Bonaire',
    es: 'bonaire',
    en: 'Bonaire',
  },
  BR: {
    ca: 'Brasil',
    es: 'Brasil',
    en: 'Brazil',
  },
  BS: {
    ca: 'Les Bahames',
    es: 'Las Bahamas',
    en: 'Bahamas',
  },
  BT: {
    ca: 'Butan',
    es: 'Bután',
    en: 'Bhutan',
  },
  BV: {
    ca: 'Illa Bouvet',
    es: 'Isla Bouvet',
    en: 'Bouvet Island',
  },
  BW: {
    ca: 'Botswana',
    es: 'Botsuana',
    en: 'Botswana',
  },
  BY: {
    ca: 'Bielorússia',
    es: 'Bielorrusia',
    en: 'Belarus',
  },
  BZ: {
    ca: 'Belize',
    es: 'Belice',
    en: 'Belize',
  },
  CA: {
    ca: 'Canadà',
    es: 'Canadá',
    en: 'Canada',
  },
  CC: {
    ca: 'Illes Cocos [Keeling].',
    es: 'Islas Cocos [Keeling]',
    en: 'Cocos [Keeling] Islands',
  },
  CD: {
    ca: 'República Democràtica del Congo',
    es: 'República Democrática del Congo',
    en: 'Democratic Republic of the Congo',
  },
  CF: {
    ca: 'República Centreafricana',
    es: 'República Centroafricana',
    en: 'Central African Republic',
  },
  CG: {
    ca: 'República del Congo',
    es: 'República del Congo',
    en: 'Republic of the Congo',
  },
  CH: {
    ca: 'Suïssa',
    es: 'Suiza',
    en: 'Switzerland',
  },
  CI: {
    ca: "Costa d'Ivori",
    es: 'Costa de Marfil',
    en: 'Ivory Coast',
  },
  CK: {
    ca: 'Illes Cook',
    es: 'Islas Cook',
    en: 'Cook Islands',
  },
  CL: {
    ca: 'Xile',
    es: 'Chile',
    en: 'Chile',
  },
  CM: {
    ca: 'Camerun',
    es: 'Camerún',
    en: 'Cameroon',
  },
  CN: {
    ca: 'Xina',
    es: 'Porcelana',
    en: 'China',
  },
  CO: {
    ca: 'Colòmbia',
    es: 'Colombia',
    en: 'Colombia',
  },
  CR: {
    ca: 'Costa Rica',
    es: 'Costa Rica',
    en: 'Costa Rica',
  },
  CU: {
    ca: 'Cuba',
    es: 'Cuba',
    en: 'Cuba',
  },
  CV: {
    ca: 'Cap Verd',
    es: 'Cabo Verde',
    en: 'Cape Verde',
  },
  CW: {
    ca: 'Curaçao',
    es: 'curazao',
    en: 'Curacao',
  },
  CX: {
    ca: 'Illa de Nadal',
    es: 'Isla de Navidad',
    en: 'Christmas Island',
  },
  CY: {
    ca: 'Xipre',
    es: 'Chipre',
    en: 'Cyprus',
  },
  CZ: {
    ca: 'República Txeca',
    es: 'Republica checa',
    en: 'Czechia',
  },
  DE: {
    ca: 'Alemanya',
    es: 'Alemania',
    en: 'Germany',
  },
  DJ: {
    ca: 'Djibouti',
    es: 'Yibuti',
    en: 'Djibouti',
  },
  DK: {
    ca: 'Dinamarca',
    es: 'Dinamarca',
    en: 'Denmark',
  },
  DM: {
    ca: 'Dominica',
    es: 'Dominica',
    en: 'Dominica',
  },
  DO: {
    ca: 'República Dominicana',
    es: 'República Dominicana',
    en: 'Dominican Republic',
  },
  DZ: {
    ca: 'Algèria',
    es: 'Argelia',
    en: 'Algeria',
  },
  EC: {
    ca: 'Equador',
    es: 'Ecuador',
    en: 'Ecuador',
  },
  EE: {
    ca: 'Estònia',
    es: 'Estonia',
    en: 'Estonia',
  },
  EG: {
    ca: 'Egipte',
    es: 'Egipto',
    en: 'Egypt',
  },
  EH: {
    ca: 'Sàhara Occidental',
    es: 'Sahara Occidental',
    en: 'Western Sahara',
  },
  ER: {
    ca: 'Eritrea',
    es: 'Eritrea',
    en: 'Eritrea',
  },
  ES: {
    ca: 'Espanya',
    es: 'España',
    en: 'Spain',
  },
  ET: {
    ca: 'Etiòpia',
    es: 'Etiopía',
    en: 'Ethiopia',
  },
  FI: {
    ca: 'Finlàndia',
    es: 'Finlandia',
    en: 'Finland',
  },
  FJ: {
    ca: 'Fiji',
    es: 'Fiyi',
    en: 'Fiji',
  },
  FK: {
    ca: 'Illes Malvines',
    es: 'Islas Malvinas',
    en: 'Falkland Islands',
  },
  FM: {
    ca: 'Micronèsia',
    es: 'Micronesia',
    en: 'Micronesia',
  },
  FO: {
    ca: 'Illes Faroe',
    es: 'Islas Faroe',
    en: 'Faroe Islands',
  },
  FR: {
    ca: 'França',
    es: 'Francia',
    en: 'France',
  },
  GA: {
    ca: 'Gabon',
    es: 'Gabón',
    en: 'Gabon',
  },
  GB: {
    ca: 'Regne Unit',
    es: 'Reino Unido',
    en: 'United Kingdom',
  },
  GD: {
    ca: 'Granada',
    es: 'Granada',
    en: 'Grenada',
  },
  GE: {
    ca: 'Geòrgia',
    es: 'Georgia',
    en: 'Georgia',
  },
  GF: {
    ca: 'Guaiana Francesa',
    es: 'Guayana Francesa',
    en: 'French Guiana',
  },
  GG: {
    ca: 'Guernsey',
    es: 'Guernesey',
    en: 'Guernsey',
  },
  GH: {
    ca: 'Ghana',
    es: 'Ghana',
    en: 'Ghana',
  },
  GI: {
    ca: 'Gibraltar',
    es: 'Gibraltar',
    en: 'Gibraltar',
  },
  GL: {
    ca: 'Groenlàndia',
    es: 'Groenlandia',
    en: 'Greenland',
  },
  GM: {
    ca: 'Gàmbia',
    es: 'Gambia',
    en: 'Gambia',
  },
  GN: {
    ca: 'Guinea',
    es: 'Guinea',
    en: 'Guinea',
  },
  GP: {
    ca: 'Guadalupe',
    es: 'Guadalupe',
    en: 'Guadeloupe',
  },
  GQ: {
    ca: 'Guinea Equatorial',
    es: 'Guinea Ecuatorial',
    en: 'Equatorial Guinea',
  },
  GR: {
    ca: 'Grècia',
    es: 'Grecia',
    en: 'Greece',
  },
  GS: {
    ca: 'Geòrgia del Sud i les illes Sandwich del Sud',
    es: 'Georgia del sur y las islas Sandwich del sur',
    en: 'South Georgia and the South Sandwich Islands',
  },
  GT: {
    ca: 'Guatemala',
    es: 'Guatemala',
    en: 'Guatemala',
  },
  GU: {
    ca: 'Guam',
    es: 'Guam',
    en: 'Guam',
  },
  GW: {
    ca: 'Guinea Bissau',
    es: 'Guinea-Bisáu',
    en: 'Guinea-Bissau',
  },
  GY: {
    ca: 'Guyana',
    es: 'Guayana',
    en: 'Guyana',
  },
  HK: {
    ca: 'Hong Kong',
    es: 'Hong Kong',
    en: 'Hong Kong',
  },
  HM: {
    ca: 'Illa Heard i illes McDonald',
    es: 'Islas Heard y McDonald',
    en: 'Heard Island and McDonald Islands',
  },
  HN: {
    ca: 'Hondures',
    es: 'Honduras',
    en: 'Honduras',
  },
  HR: {
    ca: 'Croàcia',
    es: 'Croacia',
    en: 'Croatia',
  },
  HT: {
    ca: 'Haití',
    es: 'Haití',
    en: 'Haiti',
  },
  HU: {
    ca: 'Hongria',
    es: 'Hungría',
    en: 'Hungary',
  },
  ID: {
    ca: 'Indonèsia',
    es: 'Indonesia',
    en: 'Indonesia',
  },
  IE: {
    ca: 'Irlanda',
    es: 'Irlanda',
    en: 'Ireland',
  },
  IL: {
    ca: 'Israel',
    es: 'Israel',
    en: 'Israel',
  },
  IM: {
    ca: "illa de l'home",
    es: 'Isla del hombre',
    en: 'Isle of Man',
  },
  IN: {
    ca: 'Índia',
    es: 'India',
    en: 'India',
  },
  IO: {
    ca: "Territori Britànic de l'Oceà Índic",
    es: 'Territorio Británico del Océano Índico',
    en: 'British Indian Ocean Territory',
  },
  IQ: {
    ca: 'Iraq',
    es: 'Irak',
    en: 'Iraq',
  },
  IR: {
    ca: 'Iran',
    es: 'Irán',
    en: 'Iran',
  },
  IS: {
    ca: 'Islàndia',
    es: 'Islandia',
    en: 'Iceland',
  },
  IT: {
    ca: 'Itàlia',
    es: 'Italia',
    en: 'Italy',
  },
  JE: {
    ca: 'Jersey',
    es: 'Jersey',
    en: 'Jersey',
  },
  JM: {
    ca: 'Jamaica',
    es: 'Jamaica',
    en: 'Jamaica',
  },
  JO: {
    ca: 'Jordània',
    es: 'Jordán',
    en: 'Jordan',
  },
  JP: {
    ca: 'Japó',
    es: 'Japón',
    en: 'Japan',
  },
  KE: {
    ca: 'Kenya',
    es: 'Kenia',
    en: 'Kenya',
  },
  KG: {
    ca: 'Kirguizistan',
    es: 'Kirguistán',
    en: 'Kyrgyzstan',
  },
  KH: {
    ca: 'Cambodja',
    es: 'Camboya',
    en: 'Cambodia',
  },
  KI: {
    ca: 'Kiribati',
    es: 'Kiribati',
    en: 'Kiribati',
  },
  KM: {
    ca: 'Comores',
    es: 'Comoras',
    en: 'Comoros',
  },
  KN: {
    ca: 'Saint Kitts i Nevis',
    es: 'San Cristóbal y Nieves',
    en: 'Saint Kitts and Nevis',
  },
  KP: {
    ca: 'Corea del Nord',
    es: 'Corea del Norte',
    en: 'North Korea',
  },
  KR: {
    ca: 'Corea del Sud',
    es: 'Corea del Sur',
    en: 'South Korea',
  },
  KW: {
    ca: 'Kuwait',
    es: 'Kuwait',
    en: 'Kuwait',
  },
  KY: {
    ca: 'Illes Caiman',
    es: 'Islas Caimán',
    en: 'Cayman Islands',
  },
  KZ: {
    ca: 'Kazakhstan',
    es: 'Kazajistán',
    en: 'Kazakhstan',
  },
  LA: {
    ca: 'Laos',
    es: 'Laos',
    en: 'Laos',
  },
  LB: {
    ca: 'Líban',
    es: 'Líbano',
    en: 'Lebanon',
  },
  LC: {
    ca: 'Santa Llúcia',
    es: 'Santa Lucía',
    en: 'Saint Lucia',
  },
  LI: {
    ca: 'Liechtenstein',
    es: 'Liechtenstein',
    en: 'Liechtenstein',
  },
  LK: {
    ca: 'Sri Lanka',
    es: 'Sri Lanka',
    en: 'Sri Lanka',
  },
  LR: {
    ca: 'Libèria',
    es: 'Liberia',
    en: 'Liberia',
  },
  LS: {
    ca: 'Lesotho',
    es: 'Lesoto',
    en: 'Lesotho',
  },
  LT: {
    ca: 'Lituània',
    es: 'Lituania',
    en: 'Lithuania',
  },
  LU: {
    ca: 'Luxemburg',
    es: 'luxemburgo',
    en: 'Luxembourg',
  },
  LV: {
    ca: 'Letònia',
    es: 'letonia',
    en: 'Latvia',
  },
  LY: {
    ca: 'Líbia',
    es: 'Libia',
    en: 'Libya',
  },
  MA: {
    ca: 'el Marroc',
    es: 'Marruecos',
    en: 'Morocco',
  },
  MC: {
    ca: 'Mònaco',
    es: 'Mónaco',
    en: 'Monaco',
  },
  MD: {
    ca: 'Moldàvia',
    es: 'Moldavia',
    en: 'Moldova',
  },
  ME: {
    ca: 'Montenegro',
    es: 'montenegro',
    en: 'Montenegro',
  },
  MF: {
    ca: 'Sant Martí',
    es: 'San Martín',
    en: 'Saint Martin',
  },
  MG: {
    ca: 'Madagascar',
    es: 'Madagascar',
    en: 'Madagascar',
  },
  MH: {
    ca: 'Illes Marshall',
    es: 'Islas Marshall',
    en: 'Marshall Islands',
  },
  MK: {
    ca: 'Macedònia',
    es: 'macedonia',
    en: 'Macedonia',
  },
  ML: {
    ca: 'Mali',
    es: 'Malí',
    en: 'Mali',
  },
  MM: {
    ca: 'Myanmar [Birmania]',
    es: 'Birmania [Birmania]',
    en: 'Myanmar [Burma]',
  },
  MN: {
    ca: 'Mongòlia',
    es: 'Mongolia',
    en: 'Mongolia',
  },
  MO: {
    ca: 'Macau',
    es: 'Macao',
    en: 'Macao',
  },
  MP: {
    ca: 'Illes Mariannes del Nord',
    es: 'Islas Marianas del Norte',
    en: 'Northern Mariana Islands',
  },
  MQ: {
    ca: 'Martinica',
    es: 'Martinica',
    en: 'Martinique',
  },
  MR: {
    ca: 'Mauritània',
    es: 'Mauritania',
    en: 'Mauritania',
  },
  MS: {
    ca: 'Montserrat',
    es: 'Montserrat',
    en: 'Montserrat',
  },
  MT: {
    ca: 'Malta',
    es: 'Malta',
    en: 'Malta',
  },
  MU: {
    ca: 'Maurici',
    es: 'Mauricio',
    en: 'Mauritius',
  },
  MV: {
    ca: 'Maldives',
    es: 'Maldivas',
    en: 'Maldives',
  },
  MW: {
    ca: 'Malawi',
    es: 'Malaui',
    en: 'Malawi',
  },
  MX: {
    ca: 'Mèxic',
    es: 'México',
    en: 'Mexico',
  },
  MY: {
    ca: 'Malàisia',
    es: 'Malasia',
    en: 'Malaysia',
  },
  MZ: {
    ca: 'Moçambic',
    es: 'Mozambique',
    en: 'Mozambique',
  },
  NA: {
    ca: 'Namíbia',
    es: 'Namibia',
    en: 'Namibia',
  },
  NC: {
    ca: 'Nova Caledònia',
    es: 'Nueva Caledonia',
    en: 'New Caledonia',
  },
  NE: {
    ca: 'Níger',
    es: 'Níger',
    en: 'Niger',
  },
  NF: {
    ca: 'Illa Norfolk',
    es: 'Isla Norfolk',
    en: 'Norfolk Island',
  },
  NG: {
    ca: 'Nigèria',
    es: 'Nigeria',
    en: 'Nigeria',
  },
  NI: {
    ca: 'Nicaragua',
    es: 'Nicaragua',
    en: 'Nicaragua',
  },
  NL: {
    ca: 'Holanda',
    es: 'Los países bajos',
    en: 'Netherlands',
  },
  NO: {
    ca: 'Noruega',
    es: 'Noruega',
    en: 'Norway',
  },
  NP: {
    ca: 'Nepal',
    es: 'Nepal',
    en: 'Nepal',
  },
  NR: {
    ca: 'Nauru',
    es: 'Nauru',
    en: 'Nauru',
  },
  NU: {
    ca: 'Niue',
    es: 'Niue',
    en: 'Niue',
  },
  NZ: {
    ca: 'Nova Zelanda',
    es: 'Nueva Zelanda',
    en: 'New Zealand',
  },
  OM: {
    ca: 'Oman',
    es: 'Omán',
    en: 'Oman',
  },
  PA: {
    ca: 'Panamà',
    es: 'Panamá',
    en: 'Panama',
  },
  PE: {
    ca: 'Perú',
    es: 'Perú',
    en: 'Peru',
  },
  PF: {
    ca: 'Polinèsia Francesa',
    es: 'Polinesia francés',
    en: 'French Polynesia',
  },
  PG: {
    ca: 'Papua Nova Guinea',
    es: 'Papúa Nueva Guinea',
    en: 'Papua New Guinea',
  },
  PH: {
    ca: 'Filipines',
    es: 'Filipinas',
    en: 'Philippines',
  },
  PK: {
    ca: 'Pakistan',
    es: 'Pakistán',
    en: 'Pakistan',
  },
  PL: {
    ca: 'Polònia',
    es: 'Polonia',
    en: 'Poland',
  },
  PM: {
    ca: 'Sant Pere i Miqueló',
    es: 'San Pedro y Miquelón',
    en: 'Saint Pierre and Miquelon',
  },
  PN: {
    ca: 'Illes Pitcairn',
    es: 'Islas Pitcairn',
    en: 'Pitcairn Islands',
  },
  PR: {
    ca: 'Puerto Rico',
    es: 'Puerto Rico',
    en: 'Puerto Rico',
  },
  PS: {
    ca: 'Palestina',
    es: 'Palestina',
    en: 'Palestine',
  },
  PT: {
    ca: 'Portugal',
    es: 'Portugal',
    en: 'Portugal',
  },
  PW: {
    ca: 'Palau',
    es: 'palaos',
    en: 'Palau',
  },
  PY: {
    ca: 'Paraguai',
    es: 'Paraguay',
    en: 'Paraguay',
  },
  QA: {
    ca: 'Qatar',
    es: 'Katar',
    en: 'Qatar',
  },
  RE: {
    ca: 'Reunió',
    es: 'Reunión',
    en: 'Réunion',
  },
  RO: {
    ca: 'Romania',
    es: 'Rumania',
    en: 'Romania',
  },
  RS: {
    ca: 'Sèrbia',
    es: 'Serbia',
    en: 'Serbia',
  },
  RU: {
    ca: 'Rússia',
    es: 'Rusia',
    en: 'Russia',
  },
  RW: {
    ca: 'Ruanda',
    es: 'Ruanda',
    en: 'Rwanda',
  },
  SA: {
    ca: 'Aràbia Saudita',
    es: 'Arabia Saudita',
    en: 'Saudi Arabia',
  },
  SB: {
    ca: 'Illes Salomó',
    es: 'Islas Salomón',
    en: 'Solomon Islands',
  },
  SC: {
    ca: 'Seychelles',
    es: 'Seychelles',
    en: 'Seychelles',
  },
  SD: {
    ca: 'Sudan',
    es: 'Sudán',
    en: 'Sudan',
  },
  SE: {
    ca: 'Suècia',
    es: 'Suecia',
    en: 'Sweden',
  },
  SG: {
    ca: 'Singapur',
    es: 'Singapur',
    en: 'Singapore',
  },
  SH: {
    ca: 'Santa Helena',
    es: 'Santa Elena',
    en: 'Saint Helena',
  },
  SI: {
    ca: 'Eslovènia',
    es: 'Eslovenia',
    en: 'Slovenia',
  },
  SJ: {
    ca: 'Svalbard i Jan Mayen',
    es: 'Svalbard y Jan Mayen',
    en: 'Svalbard and Jan Mayen',
  },
  SK: {
    ca: 'Eslovàquia',
    es: 'Eslovaquia',
    en: 'Slovakia',
  },
  SL: {
    ca: 'Sierra Leone',
    es: 'Sierra Leona',
    en: 'Sierra Leone',
  },
  SM: {
    ca: 'San Marino',
    es: 'San Marino',
    en: 'San Marino',
  },
  SN: {
    ca: 'Senegal',
    es: 'Senegal',
    en: 'Senegal',
  },
  SO: {
    ca: 'Somàlia',
    es: 'Somalia',
    en: 'Somalia',
  },
  SR: {
    ca: 'Surinam',
    es: 'Surinam',
    en: 'Suriname',
  },
  SS: {
    ca: 'Sudan del Sud',
    es: 'Sudán del Sur',
    en: 'South Sudan',
  },
  ST: {
    ca: 'São Tomé i Príncep',
    es: 'Santo Tomé y Príncipe',
    en: 'São Tomé and Príncipe',
  },
  SV: {
    ca: 'El Salvador',
    es: 'El Salvador',
    en: 'El Salvador',
  },
  SX: {
    ca: 'Sint Maarten',
    es: 'San Martín',
    en: 'Sint Maarten',
  },
  SY: {
    ca: 'Síria',
    es: 'Siria',
    en: 'Syria',
  },
  SZ: {
    ca: 'Swazilàndia',
    es: 'Suazilandia',
    en: 'Swaziland',
  },
  TC: {
    ca: 'Illes Turks i Caicos',
    es: 'Islas Turcas y Caicos',
    en: 'Turks and Caicos Islands',
  },
  TD: {
    ca: 'Txad',
    es: 'Chad',
    en: 'Chad',
  },
  TF: {
    ca: 'Territoris del Sud francesos',
    es: 'Territorios Franceses del Sur',
    en: 'French Southern Territories',
  },
  TG: {
    ca: 'Anar',
    es: 'Para llevar',
    en: 'Togo',
  },
  TH: {
    ca: 'Tailàndia',
    es: 'Tailandia',
    en: 'Thailand',
  },
  TJ: {
    ca: 'Tadjikistan',
    es: 'Tayikistán',
    en: 'Tajikistan',
  },
  TK: {
    ca: 'Tokelau',
    es: 'Tokelau',
    en: 'Tokelau',
  },
  TL: {
    ca: 'Timor Oriental',
    es: 'Timor Oriental',
    en: 'East Timor',
  },
  TM: {
    ca: 'Turkmenistan',
    es: 'turkmenistán',
    en: 'Turkmenistan',
  },
  TN: {
    ca: 'Tunísia',
    es: 'Túnez',
    en: 'Tunisia',
  },
  TO: {
    ca: 'Tonga',
    es: 'tonga',
    en: 'Tonga',
  },
  TR: {
    ca: 'Turquia',
    es: 'Pavo',
    en: 'Turkey',
  },
  TT: {
    ca: 'Trinitat i Tobago',
    es: 'Trinidad y Tobago',
    en: 'Trinidad and Tobago',
  },
  TV: {
    ca: 'Tuvalu',
    es: 'Tuvalu',
    en: 'Tuvalu',
  },
  TW: {
    ca: 'Taiwan',
    es: 'Taiwán',
    en: 'Taiwan',
  },
  TZ: {
    ca: 'Tanzània',
    es: 'Tanzania',
    en: 'Tanzania',
  },
  UA: {
    ca: 'Ucraïna',
    es: 'Ucrania',
    en: 'Ukraine',
  },
  UG: {
    ca: 'Uganda',
    es: 'Uganda',
    en: 'Uganda',
  },
  UM: {
    ca: 'NOSALTRES. Illes Menors Perifèriques',
    es: 'NOSOTROS. Islas menores alejadas',
    en: 'U.S. Minor Outlying Islands',
  },
  US: {
    ca: 'Estats Units',
    es: 'Estados Unidos',
    en: 'United States',
  },
  UY: {
    ca: 'Uruguai',
    es: 'Uruguay',
    en: 'Uruguay',
  },
  UZ: {
    ca: 'Uzbekistan',
    es: 'Uzbekistán',
    en: 'Uzbekistan',
  },
  VA: {
    ca: 'La ciutat del Vatica',
    es: 'Ciudad del Vaticano',
    en: 'Vatican City',
  },
  VC: {
    ca: 'Sant Vicenç i les Granadines',
    es: 'San Vicente y las Granadinas',
    en: 'Saint Vincent and the Grenadines',
  },
  VE: {
    ca: 'Veneçuela',
    es: 'Venezuela',
    en: 'Venezuela',
  },
  VG: {
    ca: 'Illes Verges Britàniques',
    es: 'Islas Vírgenes Británicas',
    en: 'British Virgin Islands',
  },
  VI: {
    ca: 'NOSALTRES. Illes Verges',
    es: 'NOSOTROS. Islas Virgenes',
    en: 'U.S. Virgin Islands',
  },
  VN: {
    ca: 'Vietnam',
    es: 'Vietnam',
    en: 'Vietnam',
  },
  VU: {
    ca: 'Vanuatu',
    es: 'Vanuatu',
    en: 'Vanuatu',
  },
  WF: {
    ca: 'Wallis i Futuna',
    es: 'Wallis y Futuna',
    en: 'Wallis and Futuna',
  },
  WS: {
    ca: 'Samoa',
    es: 'samoa',
    en: 'Samoa',
  },
  XK: {
    ca: 'Kosovo',
    es: 'Kosovo',
    en: 'Kosovo',
  },
  YE: {
    ca: 'Iemen',
    es: 'Yemen',
    en: 'Yemen',
  },
  YT: {
    ca: 'Mayotte',
    es: 'Mayotte',
    en: 'Mayotte',
  },
  ZA: {
    ca: 'Sud-Àfrica',
    es: 'Sudáfrica',
    en: 'South Africa',
  },
  ZM: {
    ca: 'Zàmbia',
    es: 'Zambia',
    en: 'Zambia',
  },
  ZW: {
    ca: 'Zimbabwe',
    es: 'Zimbabue',
    en: 'Zimbabwe',
  },
};
