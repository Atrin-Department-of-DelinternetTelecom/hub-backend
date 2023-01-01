export type file = { name: string; data: string };

export type serviceType = 'MOVIL' | 'SMS' | 'DATOS';

export type cdr = {
  date: string;
  serviceType: serviceType;
  fecha: string;
  segundos: number;
  importe: string;
  origen: string;
  destino: string;
  descripcion: string;
};

export type csvCdr = {
  day: string;
  serviceType: 'VOICE_MO' | 'SMS_MO' | 'DATA_MO';
  parseDate: string;
  trafficUnits: string;
  amountCharged: string;
  msisdn: string;
  destination: string;
  destinationPattern: string;
};

export const defs: Record<string, string> = {
  Call_Mo_Nac_Fija: 'Trucada a fix estatal',
  Call_Mo_National_Fija: 'Trucada a fix estatal',
  Call_Mo_Nac_IOS: 'Trucada a mòbil estatal',
  Call_Mo_Nac_M2M: 'Trucada a mòbil estatal',
  Call_Mo_Nac_Movil: 'Trucada a mòbil estatal',
  Call_Mo_Nac_Superonnet: 'Trucada a mòbil estatal',
  Call_Mo_National_Movil: 'Trucada a mòbil estatal',
  Call_Mo_Roaming_Zone1_Zone1: 'Trucada roaming',
  Call_Mo_Roaming_Zone1_Zone1_Free: 'Trucada roaming',
  Call_Mo_Roaming_Zone1_Zone2: 'Trucada roaming',
  Call_Mo_Roaming_Zone1_Zone3: 'Trucada roaming',
  Gprs_Mo_Roaming_IP_Zone1: 'Dades roaming',
  Gprs_Mo_Roaming_IP_Zone1_Free: 'Dades roaming',
  Gprs_Mo_Roaming_IP_Zone2: 'Dades roaming',
  Gprs_Mo_Roaming_Zone1: 'Dades roaming',
  Gprs_Mo_Roaming_Zone1_Free: 'Dades roaming',
  Gprs_Mo_Roaming_Zone2: 'Dades roaming',
  Gprs_Mo_Roaming_Zone3: 'Dades roaming',
  Gprs_Mo_Nac: 'Dades estatals',
  Gprs_Mo_Nac_Free: 'Dades estatals',
  Sms_Mo_Nac_Fija: 'Sms estatal',
  Sms_Mo_Nac_Gestion: 'Sms estatal',
  Sms_Mo_Nac_Ios: 'Sms estatal',
  Sms_Mo_Nac_Movil: 'Sms estatal',
  Sms_Mo_Nac_Superonnet: 'Sms estatal',
  Sms_Mo_Int_Zone_1_EUROPA_CELL: 'Sms internacional',
  Sms_Mo_Int_Zone_2_AMERICA: 'Sms internacional',
  Sms_Mo_Int_Zone_2_AMERICA_CELL: 'Sms internacional',
  Sms_Mo_Int_Zone_3_AFRICA_CELL: 'Sms internacional',
  Sms_Mo_Int_Zone_4_ASIA_CELL: 'Sms internacional',
  Sms_Mo_Int_Zone_5_OCEANIA_CELL: 'Sms internacional',
  Sms_Mo_Roaming_Zone1_Zone1: 'Sms roaming',
  Sms_Mo_Roaming_Zone1_Zone1_Free: 'Sms roaming',
  Sms_Mo_Roaming_Zone1_Zone2: 'Sms roaming',
  Sms_Mo_Roaming_Zone1_Zone3: 'Sms roaming',
  Sms_Mo_Roaming_Zone2_Zone1: 'Sms roaming',
  Sms_Mo_Roaming_Zone2_Zone2: 'Sms roaming',
  Sms_Mo_Roaming_Zone3_Zone1: 'Sms roaming',
  Sms_Mo_Roaming_Zone3_Zone2: 'Sms roaming',
  Sms_Mo_Roaming_Zone3_Zone3: 'Sms roaming',
  Call_Mo_Int_AfricaFree: 'Trucada internacional',
  Call_Mo_Int_AmericaFree: 'Trucada internacional',
  Call_Mo_Int_AsiaFree: 'Trucada internacional',
  Call_Mo_Int_EuropaFree: 'Trucada internacional',
  Call_Mo_Int_Zone_1_EUROPA: 'Trucada internacional',
  Call_Mo_Int_Zone_1_EUROPA_CELL: 'Trucada internacional',
  Call_Mo_Int_Zone_2_AMERICA: 'Trucada internacional',
  Call_Mo_Int_Zone_2_AMERICA_CELL: 'Trucada internacional',
  Call_Mo_Int_Zone_3_AFRICA: 'Trucada internacional',
  Call_Mo_Int_Zone_3_AFRICA_CELL: 'Trucada internacional',
  Call_Mo_Int_Zone_4_ASIA: 'Trucada internacional',
  Call_Mo_Int_Zone_4_ASIA_CELL: 'Trucada internacional',
  Call_Mo_Int_Zone_5_OCEANIA_CELL: 'Trucada internacional',
  Call_Mo_Roaming_Zone2_Zone1: 'Trucada roaming',
  Call_Mo_Roaming_Zone2_Zone2: 'Trucada roaming',
  Call_Mo_Roaming_Zone3_Zone1: 'Trucada roaming',
  Call_Mo_Roaming_Zone3_Zone2: 'Trucada roaming',
  Call_Mo_Special_010: 'Trucada especial',
  Call_Mo_Special_011: 'Trucada especial',
  Call_Mo_Special_012: 'Trucada especial',
  Call_Mo_Special_016: 'Trucada especial',
  Call_Mo_Special_060: 'Trucada especial',
  Call_Mo_Special_061: 'Trucada especial',
  Call_Mo_Special_062: 'Trucada especial',
  Call_Mo_Special_080: 'Trucada especial',
  Call_Mo_Special_085: 'Trucada especial',
  Call_Mo_Special_088: 'Trucada especial',
  Call_Mo_Special_091: 'Trucada especial',
  Call_Mo_Special_092: 'Trucada especial',
  Call_Mo_Special_1002: 'Trucada especial',
  Call_Mo_Special_1004: 'Trucada especial',
  Call_Mo_Special_1400: 'Trucada especial',
  Call_Mo_Special_1414: 'Trucada especial',
  Call_Mo_Special_1478: 'Trucada especial',
  Call_Mo_Special_1489: 'Trucada especial',
  Call_Mo_Special_16__: 'Trucada especial',
  Call_Mo_Special_17__: 'Trucada especial',
  Call_Mo_Special_800: 'Trucada especial',
  Call_Mo_Special_900: 'Trucada especial',
  Call_Mo_Special_901: 'Trucada especial',
  Call_Mo_Special_9011: 'Trucada especial',
  Call_Mo_Special_9012: 'Trucada especial',
  Call_Mo_Special_9013: 'Trucada especial',
  Call_Mo_Special_9015: 'Trucada especial',
  Call_Mo_Special_902: 'Trucada especial',
  Call_Mo_Special_CC: 'Trucada especial',
  Call_Mo_Special_VMS: 'Trucada especial',
  Call_Mo_VpnMovil: 'Trucada VPN mòbil',
  Call_Mo_Roaming_Zone3_Zone3: 'Trucada roaming',
  Call_Mo_Nac_Movil_Vpn: 'Trucada VPN mòbil',
};

export const serviceConverter: Record<string, string> = {
  VOICE_MO: 'MOVIL',
  SMS_MO: 'SMS',
  DATA_MO: 'DATOS',
  VOICE_MT: 'MOVIL',
};
