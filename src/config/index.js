'use strict';

const path = require('path');
const configLib = require('@lib/config');

const APP_NAME = process.env.APP_NAME || 'Delinternet HUB';
const rootConfig = {
  secret: `your_secret_key`, // Secret Key
  frontRedirectUrl: process.env.FRONT_REDIRECT_URL,
  server: {
    // Express
    ip: process.env.SERVER_IP || 'localhost',
    port: process.env.SERVER_PORT || 8009,
  },
  log: true, // show logs
  // Roles: if a user has multiple roles, will take the time of the greater role
  roles: [
    {
      role: 'user',
      ttl: '60 minutes',
    },
    {
      role: 'admin',
      ttl: '5 days',
    },
  ],
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_BASE_URL,
  },
  lemon: {
    username: process.env.LEMON_USERNAME,
    password: process.env.LEMON_PASSWORD,
    ftp: {
      host: process.env.LEMON_FTP_HOST,
      port: process.env.LEMON_FTP_PORT,
      username: process.env.LEMON_FTP_USERNAME,
      password: process.env.LEMON_FTP_PASSWORD,
    },
  },
  emailConfig: {
    token: process.env.EMAIL_TOKEN,
    credentials: process.env.EMAIL_CREDENTIALS,
  },
  inventory: {
    proxy: process.env.INVENTORY_PROXY === 'true',
    url: process.env.INVENTORY_URL,
  },
  convertXml: { endpoint: process.env.CONVERT_XML_ENDPOINT },
  GfKamailioProviderCdrPath: 'mooisp/content1/fixCdr',
  minIoBuckets: {
    'fix-provider-cdr': process.env.MINIO_PROVIDER_CDR_BUCKET_URI,
    avatar: process.env.MINIO_AVATAR_BUCKET_URI,
    remittance: process.env.MINIO_REMITTANCE_BUCKET_URI,
    'invoice-cache': process.env.MINIO_INVOICE_CACHE_BUCKET_URI,
    public: process.env.MINIO_PUBLIC_BUCKET_URI,
    cache: process.env.MINIO_CACHE_BUCKET_URI,
    GfClientDocument: process.env.MINIO_CLIENT_DOCUMENT_BUCKET_URI,
    'GfClient/Document': process.env.MINIO_GFCLIENT_DOCUMENT_BUCKET_URI,
    'GfInstallationEvaluationForm/Signature':
      process.env.MINIO_EVALUATION_SIGNATURE_BUCKET_URI,
    'GfContractDataInternet/Image': process.env.MINIO_DATA_INTERNET_BUCKET_URI,
    'client-contact': process.env.MINIO_CLIENT_CONTACT_BUCKET_URI,
    'invoice-client-logo': process.env.MINIO_INVOICE_CLIENT_LOGO_BUCKET_URI,
    'crm-task': process.env.MINIO_CRM_TASK_BUCKET_URI,
    'gf-incidence': process.env.MINIO_GF_INCIDENCE_BUCKET_URI,
    'gf-assist': process.env.MINIO_GF_ASSIST_BUCKET_URI,
    GlobalMedia: process.env.MINIO_GLOBAL_MEDIA_BUCKET_URI,
    lemon: process.env.MINIO_LEMON_BUCKET_URI,
    'GlobalMedia/Conversion':
      process.env.MINIO_GLOBAL_MEDIA_CONVERSION_BUCKET_URI,
    ClientCommentAvatar: process.env.MINIO_CLIENT_COMMENT_AVATAR_BUCKET_URI,
    'invoice-pdf': process.env.MINIO_INVOICE_PDF_BUCKET_URI,
    'unpaid/xml': process.env.MINIO_UNPAID_XML_BUCKET_URI,
    'technician-media': process.env.MINIO_TECHNICIAN_MEDIA_BUCKET_URI,
  },
  googleMapKey: 'AIzaSyD2OrTDpPRW1efFum6w5W5EfFhlhlnOWsw',
  googleCalendarApi: 'https://www.googleapis.com/auth/calendar',
  AddressApi: 'https://geo.goufone.com/api/v1/',
  path: {
    disabled: '/:url(api|assets|auth|config|lib|views)/*', // paths 404
  },
  calendarConfig:
    process.env.CALENDAR_CREDENTIALS ||
    '{"web":{"client_id":"243655140483-nt3namr6jovspu68f66fg8cmd996r1uf.apps.googleusercontent.com","project_id":"test-calendar-354706","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"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","redirect_uris":["http://localhost:9000/api/v1/moozaicUsers/fromGoogle"],"javascript_origins":["http://localhost:9000"]}}',
  serviceAccount: process.env.SERVICE_ACCOUNT_EMAIL,
  paivateKey: process.env.PRIVATE_KEY,
  webOrderGoogleSheet: {
    id: process.env.WEB_ORDER_GOOGLE_SHEET_ID,
    page: process.env.WEB_ORDER_GOOGLE_SHEET_PAGE,
  },
  callMeGoogleSheet: {
    id: process.env.CALL_ME_GOOGLE_SHEET_ID,
    page: process.env.CALL_ME_GOOGLE_SHEET_PAGE,
  },
  mqtt: {
    url: process.env.MQTT_URL || 'mqtt://hrms.delinternet.com',
    username: process.env.MQTT_USERNAME || 'admin',
    password: process.env.MQTT_PASSWORD || 'heymyfriend18',
  },
  sequelize: {
    database: process.env.DATABASE,
    // timezone: process.env.DATABASE_TIMEZONE,
    sqlite: process.env.SEQUELIZE_SQLITE_DB_NAME,
    postgres: process.env.SEQUELIZE_POSTGRES_URL,
    system: {
      host: process.env.SEQUELIZE_MYSQL_HOST_SYSTEM || 'localhost',
      port: parseInt(process.env.SEQUELIZE_MYSQL_PORT_SYSTEM) || 3306,
      database: process.env.SEQUELIZE_MYSQL_DATABASE_SYSTEM,
      username: process.env.SEQUELIZE_MYSQL_USERNAME_SYSTEM,
      password: process.env.SEQUELIZE_MYSQL_PASSWORD_SYSTEM,
    },
    moozaic: {
      host: process.env.SEQUELIZE_MYSQL_HOST_MOOZAIC || 'localhost',
      port: parseInt(process.env.SEQUELIZE_MYSQL_PORT_MOOZAIC) || 3306,
      database: process.env.SEQUELIZE_MYSQL_DATABASE_MOOZAIC,
      username: process.env.SEQUELIZE_MYSQL_USERNAME_MOOZAIC,
      password: process.env.SEQUELIZE_MYSQL_PASSWORD_MOOZAIC,
    },
    intranet: {
      host: process.env.SEQUELIZE_MYSQL_HOST_INTRANET || 'localhost',
      port: parseInt(process.env.SEQUELIZE_MYSQL_PORT_INTRANET) || 3306,
      database: process.env.SEQUELIZE_MYSQL_DATABASE_INTRANET,
      username: process.env.SEQUELIZE_MYSQL_USERNAME_INTRANET,
      password: process.env.SEQUELIZE_MYSQL_PASSWORD_INTRANET,
    },
    delstats: {
      host: process.env.SEQUELIZE_MYSQL_HOST_DELSTATS || 'localhost',
      port: parseInt(process.env.SEQUELIZE_MYSQL_PORT_DELSTATS) || 3306,
      database: process.env.SEQUELIZE_MYSQL_DATABASE_DELSTATS,
      username: process.env.SEQUELIZE_MYSQL_USERNAME_DELSTATS,
      password: process.env.SEQUELIZE_MYSQL_PASSWORD_DELSTATS,
    },
  },
  reset_password: {
    url: 'someUrl/changePassword',
    expire_time: 5 * 60 * 1000,
  },

  invoice: {
    concurrentExecuteInvoiceAction:
      process.env.CONCURRENT_EXECUTE_INVOICE_ACTION ?? 250,
    // if a client has more than (n) cell service that invoiced, we will cache its invoice
    invoiceCellServiceCacheThreshold: 4,
    invoiceCacheRedirectUrl: process.env.INVOICE_CACHE_REDIRECT_URL,
  },

  mainDomain: 'https://delinternet.com/',
  FilesAndDirectories: {
    clientAvatar: 'client-avatar',
    uploads: 'uploads',
    VacationSignDoc: 'vacation-sign-doc',
    FormFile: 'form-file',
    Build: 'build',
    XMLDocument: 'xml-document',
    AdminDocs: 'admin-docs',
    attachImageToPdf: 'attachImageToPdf',
    Template: 'template',
    InitedTemplate: 'inited-template',
    UserDocs: 'user-docs',
    EmployeeSignature: 'employee-signatures',
    CompanySignature: 'company-signatures',
    KilometerImage: 'kilometer-images',
    Payments: 'payments',
    PayrollAttachment: 'payroll-attachments',
    Signatures: 'signatures',
    VacationSignature: 'vacation-signatures',
    Avatars: 'avatars',
    VacationHtml: 'vacation_html',
    SignDocImage: 'sign_doc_image',
    UserDocSinature: 'user-doc-signature',
    payrollPdfImage: 'payroll-pdf-image',
    TestFile: 'test-file',
    AdminDocPdfImage: 'admin-doc-pdf-image',
    EducationProofDoc: 'education_proof_doc',
    CertificationProofDoc: 'certification_proof_doc',
    DefaultPath: 'default',
    Temporary: 'temp',
    Manifest: 'manifests',
    Logo: 'logo',
    materialImage: 'material',
    userDocumentFile: 'user-document',
  },
  FormFieldType: [
    'number', // integer
    'text', //string
    'textarea', //string
    'password', //string
    'email', //string
    'select', // string
    'asyncselect', // like select
    'multiselect', // array
    'asyncmultiselect', // array
    'searcher', // object
    'datepicker', // string
    'timepicker', // string
    'colorpicker', // string
    'inputfile',
    'currency', // is float
    'switch', // is boolean
    'checkbox', // is boolean
    'iconSelector', // string
    'datetimepicker', //string
  ],
  // TODO(erfan): we dont need this
  InvoiceIssueType: {
    NOTIFICATION: 'Notification',
    INVOICE: 'Invoice',
    CLIENT: 'Client',
  },
  // TODO(erfan): we dont need this
  Notifications: {
    SendDoc: {
      concept: 'send_doc',
      subject: 'new document',
      text: 'u have new document',
    },
  },
  translation: {
    section: ['text'],
    definition: [
      'slug',
      'title',
      'promotion',
      'price',
      'detail',
      'detailsextra',
      'products',
      'Ctatext',
      'footer',
      'feature_1',
      'feature_2',
      'feature_3',
      'feature_4',
      'feature_5',
      'feature_6',
      'feature_7',
      'feature_8',
      'feature_9',
      'feature_10',
      'feature_11',
      'feature_12',
    ],
  },
  swagger: {
    // Swagger
    swagger_title: process.env.SWAGGER_TITLE || 'Swagger UI',
    enabled: true, // router -> http://localhost:8000/docs/
    versionNumber: 1,
    info: {
      version: 'v1.0',
      title: APP_NAME,
      description: `RESTful API ${APP_NAME}`,
      contact: {
        name: 'Developer',
        url: 'http://delinternet.com',
        email: 'mostafa@delinternet.com',
      },
      license: {
        name: 'MIT',
        url: 'https://delinternet.com',
      },
    },
  },
  pagination: {
    pageSize: 10,
    pageNumber: 1,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  oAuth: {
    // oAuth
    local: {
      enabled: true,
    },
  },
  pdfMaker: {
    url: 'http://pdf2.delinternet.com/api/v1/convert/pdf-to-img',
    pageNumber: 1,
    density: 72,
    scale: 1,
  },
  AttachPdf: {
    url: 'http://pdf2.delinternet.com/api/v1/attach/sign-to-pdf',
  },
  convertHandleBarsToPdf: {
    url: 'http://pdf2.delinternet.com/api/v1/convert/html-to-pdf',
  },
  formattedAddressApi: {
    url: 'https://nominatim.openstreetmap.org',
  },
  AvatarImageSize: 2000000, //kb
  bull: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '1'),
    queues: {
      test: 'test',
      contaplus: 'contaplus',
      telegram: 'notification-telegram',
      sms: 'notification-sms',
    },
  },
  signaturePad: {
    validTime: 20 * 60 * 1000,
  },
  // globals
  mode: process.env.NODE_ENV || 'development', // mode
  name: APP_NAME, // name
  node: parseInt(process.env.NODE_APP_INSTANCE) || 0, // node instance
  root: path.resolve(), // root
  base: path.resolve('src'), // base
  client: path.resolve('client'),
  templates: path.resolve('src/api/templates'),
  intranet: {
    uid: Number(process.env.UID) || 90,
    deleteStatus: Number(process.env.DELETE_STATUS) || 0,
  },

  // FTP configurations
  ftp: {
    /**
     * Default disk name
     * @type {String}
     */
    default: 'default',

    /**
     * List of available disks
     *
     * @type {Object}
     */
    disks: {
      default: {
        host: process.env.FTP_HOST,
        port: Number(process.env.FTP_PORT) || 21,
        username: process.env.FTP_USERNAME,
        password: process.env.FTP_PASSWORD,
        root: process.env.FTP_ROOT || null,
        url: process.env.FTP_URL || null,
        readOnly: process.env.FTP_READONLY !== 'false',
      },
    },
  },

  operadors: {
    key: process.env.OPERADORS_KEY,
    endpoint: process.env.OPERADORS_ENDPOINT,
    seed: process.env.OPERADORS_SEED,
    readOnly: process.env.OPERADORS_READONLY !== 'false',
    blockRatingPlanGroupId: process.env.OPERADORS_BLOCK_RATING_PLAN_GROUP_ID
      ? Number(process.env.OPERADORS_BLOCK_RATING_PLAN_GROUP_ID)
      : undefined,
    municipality: process.env.OPERADORS_MUNICIPALITY,
    portabProcessCode: process.env.OPERADORS_PORTABILITY_PROCESS_CODE,
    portabTypeCode: process.env.OPERADORS_PORTABILITY_TYPE_CODE,
    portabWholesaleCode: process.env.OPERADORS_PORTABILITY_WHOLESALE_CODE,
  },

  radius: {
    endpoint: process.env.RADIUS_ENDPOINT,
    key: process.env.RADIUS_KEY,
    headerTag: process.env.RADIUS_HEADER_TAG,
    apiSeed: process.env.RADIUS_SEED,
    readOnly: process.env.RADIUS_READONLY !== 'false',
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  aire: {
    endpoint: process.env.AIRE_ENDPOINT,
    key: process.env.AIRE_KEY,
    user: process.env.AIRE_USER,
    pass: process.env.AIRE_PASS,
    token: process.env.AIRE_TOKEN,
    readOnly: process.env.AIRE_READONLY !== 'false',
  },

  cpe: {
    endpoint: process.env.CPE_ENDPOINT,
  },

  /**
   * API operations.
   *
   * use this configs to disable/enable API's update operations.
   */
  api_operations: {
    AIRE_UPDATE_DISABLED: process.env.AIRE_UPDATE_DISABLED !== 'false',
  },

  /**
   * API operations.
   *
   * use this configs to disable/enable API's update operations.
   */
  pdf2: {
    endpoint: process.env.PDF_TWO_ENDPOINT || 'http://pdf2.delinternet.com',
    token: process.env.PDF_TWO_TOKEN,
  },

  /**
   * Cron jobs configurations.
   *
   * @type object
   */
  tasks: {
    checkFirstConnection: {
      enabled: process.env.CHECK_FIRST_CONNECTION_ENABLED === 'true',
      period: process.env.CHECK_FIRST_CONNECTION_PERIOD ?? '0 */10 * * * *',
    },
    checkExecutedStates: {
      enabled: process.env.CHECK_EXECUTED_STATE_ENABLED === 'true',
      period: process.env.CHECK_EXECUTED_STATE_PERIOD ?? '0 */10 * * * *',
    },
    importfeesAction: {
      enabled: process.env.CHECK_IMPORT_FEE_ENABLED === 'true',
      period: process.env.CHECK_IMPORT_FEE_PERIOD ?? '0 30 1 * * *',
    },
    loadMobileCdr: {
      enabled: process.env.LOAD_MOBILE_CDR_ENABLED === 'true',
      period: process.env.LOAD_MOBILE_CDR_PERIOD ?? '0 0 * * * *',
    },
    scheduledSuspensions: {
      enabled: process.env.SCHEDULED_SUSPENSIONS_ENABLED === 'true',
      period: process.env.SCHEDULED_SUSPENSIONS_PERIOD ?? '0 0 * * * *',
    },
    suspendUnpaidCustomers: {
      enabled: process.env.SUSPEND_UNPAID_CUSTOMERS_ENABLED === 'true',
      period: process.env.SUSPEND_UNPAID_CUSTOMERS_PERIOD ?? '0 0 * * * *',
    },
    refreshRadiusLookups: {
      enabled: process.env.REFRESH_RADIUS_LOOKUPS_ENABLED === 'true',
      period: process.env.REFRESH_RADIUS_LOOKUPS_PERIOD ?? '0 20 */3 * * *',
      perPage: process.env.REFRESH_RADIUS_LOOKUPS_PERPAGE ?? 300,
      effectiveDay: process.env.REFRESH_RADIUS_LOOKUPS_EFFECTIVE_DAY ?? 4,
    },
    refreshCpeLookups: {
      enabled: process.env.REFRESH_CPE_LOOKUPS_ENABLED === 'true',
      period: process.env.REFRESH_CPE_LOOKUPS_PERIOD ?? '0 30 */3 * * *',
    },
    importAireLines: {
      enabled: process.env.IMPORT_AIRE_LINES_ENABLED === 'true',
      period: process.env.IMPORT_AIRE_LINES_PERIOD ?? '0 0 22,10 * * *',
    },
    importAireRequests: {
      enabled: process.env.IMPORT_AIRE_REQUESTS_ENABLED === 'true',
      period: process.env.IMPORT_AIRE_REQUESTS_PERIOD ?? '0 0 23,11 * * *',
    },
    revisionCellContracts: {
      enabled: process.env.REVISION_CELL_CONTRACTS_ENABLED === 'true',
      period: process.env.REVISION_CELL_CONTRACTS_PERIOD ?? '0 0 14,3 * * *',
    },
    syncRadiusState: {
      enabled: process.env.SYNC_RADIUS_STATE_ENABLED === 'true',
      period: process.env.SYNC_RADIUS_STATE_PERIOD ?? '0 40 * * * *',
    },
    ftpToMinio: {
      enabled: process.env.TRANSFER_FTP_TO_MINIO_ENABLED === 'true',
      period: process.env.TRANSFER_FTP_TO_MINIO_PERIOD ?? '*/10 * * * * *',
      models: (process.env.TRANSFER_FTP_TO_MINIO_MODLES ?? '').split('|'),
    },
    cutUnpaidInvoices: {
      enabled: process.env.CUT_UNPAID_INVOICES_ENABLED === 'true',
      period: process.env.CUT_UNPAID_INVOICES_PERIOD,
    },
    executekamailios: {
      enabled: process.env.EXECUTE_KAMAILIOS_INVOICES_ENABLED === 'true',
      period: process.env.EXECUTE_KAMAILIOS_INVOICES_PERIOD,
    },
    sendUnpaidNotifications: {
      enabled: process.env.SEND_UNPAID_NOTIFICATIONS_ENABLED === 'true',
      period: process.env.SEND_UNPAID_NOTIFICATIONS_PERIOD,
    },
    updateGeo: {
      enabled: process.env.UPDATE_GEO_ENABLED === 'true',
    },
    revisionLandlines: {
      enabled: process.env.REVISION_LANDLINES_ENABLED === 'true',
      period: process.env.REVISION_LANDLINES_PERIOD ?? '0 0 14,3 * * *',
    },
    revisionOutboundEvents: {
      enabled: process.env.REVISION_OUTBOUND_ENABLED === 'true',
      period: process.env.REVISION_OUTBOUND_PERIOD ?? '0 0 14,3 * * *',
    },
    revisionFixContracts: {
      enabled: process.env.REVISION_FIX_CONTRACTS_ENABLED === 'true',
      period: process.env.REVISION_FIX_CONTRACTS_PERIOD ?? '0 0 14,3 * * *',
    },
    suspendPendingContracts: {
      enabled: process.env.SUSPEND_PENDING_CONTRACTS_ENABLED === 'true',
      period: process.env.SUSPEND_PENDING_CONTRACTS_PERIOD ?? '0 0 0 * * *',
      pendingDays: process.env.SUSPEND_PENDING_CONTRACTS_LIMIT ?? 30,
    },
    pendingTechnicianTasks: {
      enabled: process.env.PENDING_TECHNICIAN_TASK_ENABLED === 'true',
      period: process.env.PENDING_TECHNICIAN_TASK_PERIOD ?? '30 23 * * *',
    },
    revisionLemonLines: {
      enabled: process.env.REVISION_LEMON_LINES_ENABLED === 'true',
      period: process.env.REVISION_LEMON_LINES_PERIOD ?? '0 0 21,9 * * *',
    },
    loadUnpaidXml: {
      enabled: process.env.LOAD_UNPAID_INVOICE_ENABLED === 'true',
      period: process.env.LOAD_UNPAID_INVOICE_PERIOD ?? '0 0 * * * *',
    },
    syncContractDocuments: {
      enabled: process.env.SYNC_CONTRACT_DOCUMENTS_ENABLED === 'true',
      period: process.env.SYNC_CONTRACT_DOCUMENTS_PERIOD ?? '0 0 0 * * *',
    },
    syncContractDocumentPackages: {
      enabled: process.env.SYNC_CONTRACT_DOCUMENT_CACHES_ENABLED === 'true',
      period: process.env.SYNC_CONTRACT_DOCUMENT_CACHES_PERIOD ?? '0 0 0 * * *',
    },
  },

  /**
   * Available locales.
   *
   * @type
   */
  locales: [
    {
      name: 'English',
      locale: 'en',
    },
    {
      name: 'Spanish',
      locale: 'es',
    },
    {
      name: 'Catalan',
      locale: 'ca',
    },
  ],

  documents: {
    cache: process.env.DISABLE_DOCUMENT_CACHE !== 'true',
  },

  app: {
    url: process.env.APP_URL,
  },

  club: {
    endpoint: process.env.CLUB_ENDPOINT,
    apiKey: process.env.CLUB_API_KEY,
    impersonateUrl: process.env.CLUB_IMPERSONATE_URL,
    secretKey: process.env.JWT_CLUB_SECRET,
  },

  ibanValidator:
    process.env.IBAN_VALIDATOR ??
    `http://iban.delinternet.com/v1/validate/__IBAN__`,
};

configLib.set('index', rootConfig);
configLib.load(__dirname);

const notDeprecatedExports = {
  get: configLib.get,
  set: configLib.set,
  isProduction: () =>
    configLib.get('index.mode', 'production') === 'production',
  isLocal: () => configLib.get('index.mode', 'production') === 'development',
  isTest: () => configLib.get('index.mode', 'production') === 'test',
};

module.exports = new Proxy(
  {
    ...rootConfig,
    ...notDeprecatedExports,
  },
  {
    get(obj, key) {
      if (notDeprecatedExports[key]) {
        return notDeprecatedExports[key];
      }

      if (key === '__esModule') return obj[key];

      console.warn(
        `Usage of old config system detected => key:"${key}". use config.get(...)`,
        new Error().stack,
      );

      return obj[key];
    },
  },
);
