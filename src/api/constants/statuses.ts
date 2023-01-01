export enum ASSIGNABLE {
  ASSIGNABLE = 'assignable',
  ASSIGNED = 'assigned',
  RESERVED = 'reserved',
}

export enum ASSIGNABLE_HISTORY {
  REALEASED = 'realeased',
  ASSIGNED = 'assigned',
  RESERVED = 'reserved',
}

export enum CONTRACT {
  ACTIVE = 'active',
  PENDING_CHANGE = 'pendingChange',
  SUSPENDED = 'suspended',
  PENDING_SECTION_READY = 'pendingSectionsReady',
  BLOCKED = 'blocked',
}

export enum SECTION_STATUS {
  EMPTY = 'empty',
  DONE = 'done',
  EXECUTED = 'executed',
  PENDING = 'pending',
  ERROR = 'error',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
}

//TODO: add more if exists
export enum SECTION_STATUS_PENDINGS {
  AGENDATION = 'step1',
  AGENDATE = 'step2',
  INSTALLED = 'step2.5',
  RADIUS_OR_CPE_ERROR = 'step2.7',
  WAITING_FIRST_CONNECTION = 'waitingRadius',
  WAITFOR_PROVIDER = 'w8forprovider',
  AIRE_REGISTERED = 'step1',
  EXECUTED = 'executed',
  INSTALLATION = 'installation',
  SIGNING = 'signing',
}

export enum DISCOUNT_SCHEDULED {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPLIED = 'applied',
  CANCELED = 'canceled',
  PARTIALLY_APPLIED = 'partialApplied',
}

export enum CHNAGE_HOLDER_STATE {
  DONE = 'done',
  INPROGRESS = 'inProgress',
}

export enum CHNAGE_HOLDER_STATE_OPTION {
  PENDING_DOCUMENTATION = 'pendingDocumentation',
  WAITFOR_PROVIDER = 1,
  DEFAULT = '',
}

export enum RADIUS_STATE {
  BLOCKED = 'IMPAGAT',
}

export enum BONUS {
  DONE = 'done',
  PENDING_DEACTIVATION = 'pendingDeactivation',
  PENDING_ACTIVATION = 'pendingActivation',
}

export enum FILE_TRANSFER {
  SCHEDULED = 'scheduled',
  FAILED = 'failed',
  DONE = 'done',
}

export enum AIRE_STATUS {
  ACTIVATE = 'ACTIVA',
}

export enum LEMON_STATUS {
  PRE_ACTIVATE = 'Preactivado',
  ACTIVATE = 'Activado',
}

export enum LEMON_PORTABILITY_STATUS {
  CHECKING = 'checking',
  CONFIGURING = 'configuring',
  CONFIGURED = 'configured',
  REQUESTED = 'requested',
  FAILED = 'failed',
}

export enum SUSPENDING_STATE {
  DONE = 'done',
  SIGNING = 'signing',
  SCHEDULED = 'signing',
}
