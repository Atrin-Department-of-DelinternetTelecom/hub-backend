export enum SERVICE {
  CELL = 'CELL',
  FIX = 'FIX',
  INTERNET = 'INTERNET',
  TV = 'TV',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum DATA_SECTION {
  CELL = 'dataCell',
  FIX = 'dataFix',
  INTERNET = 'dataInternet',
  TV = 'dataTv',
  SUBSCRIPTION = 'dataSubscription',
}

export enum DATA_FIX_TYPE {
  PARTICULAR = 'particular',
  COMPANY = 'company',
}

export enum IVOZ_TYPE {
  HOME = 'home',
  RESIDENTIAL = 'residential',
}

export enum IVOZ_STATE {
  PENDING = 'pending',
  INPROGRESS = 'in_progress',
  DONE = 'done',
  ERROR = 'error',
  PREPARING = 'preparing',
  PREPARED = 'prepared',
}

export enum CDR_STATES {
  INCOME = 'callIn',
  OUTCOME = 'callOut',
  DATOS = 'data',
  SMS = 'sms',
}

export enum AIRE_CDR_STATES {
  INCOME = 'MOVIL_ENTRANTE',
  OUTCOME = 'MOVIL',
  DATA = 'DATOS',
  SMS = 'SMS',
}

export enum INTERNET_TECHNOLOGY {
  RADIO = 'radio',
  OTHER = 'altres',
  FIBER = 'fibra',
  ADSL = 'adsl',
  FOURG = '4g',
  EXTERNAL = 'no_nostre',
}

export enum BONUS_TECHNOLOGY {
  ADSL = 'ADSL',
  BONOSRAROS = 'BONOSRAROS',
  RADIO = 'RADIO',
  FIXBONUS = 'FIXBONUS',
  FIBRA = 'FIBRA',
  FIBRAINTERNET = 'FIBRAINTERNET',
  PERCENTAGE = 'PERCENTAGE',
}

export enum BONUS_RULE {
  INTERNET = 'INTERNET',
  INTERNET_BONO = 'INTERNET+BONO',
  SLA = 'SLA',
  IP = 'IP',
  TRANSPORT = 'TRANSPORT',
  MATERIAL = 'MATERIAL',
  TELE = 'TELE',
  BONODONACIO = 'BONODONACIO',
  BONOCAPEX = 'BONOCAPEX',
  BONOFINAN = 'BONOFINAN',
  SERVEISEXTERNS = 'SERVEISEXTERNS',
  CENTRALETA = 'CENTRALETA',
}

export enum SUSPENSION_ACTION_TYPE {
  DELETE = 'DELETE',
  CHANGE_TECHNOLOGY = 'CHANGE_TECHNOLOGY',
  FROZEN = 'FROZEN',
}

export enum CELL_ACTUAL_MODALITY {
  PRE_PAGO = 'pretpago',
  POS_PAGO = 'postpago',
}

export enum CELL_PROVIDER_CODE {
  AIRE = 'aire',
  LEMON = 'lemon',
}

export enum CELL_PAYMENT_METHOD {
  EFFECTIVE = 'efectiu',
  CARD = 'tarjeta',
  BANK = 'banc',
  CHANGE_HOLDER = 'canviTitular',
}

export enum CELL_SIM_TYPE {
  ESIM = 'esim',
  PHYSICAL = 'physical',
}

export enum BLOCK_STATE {
  REQUESTED = 'REQUESTED',
  CANCELED = 'CANCELED',
  RESTABLISHED = 'RESTABLISHED',
  CUT = 'CUT',
}
