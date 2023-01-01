import { SmspubliReport } from '@api/models/global/global_smspubli_report';

interface DeliveryReport {
  sms_id: string;
  from: string;
  to: string;
  custom: string;
  sms_date: string;
  status:
    | 'DELIVRD'
    | 'ACCEPTD'
    | 'EXPIRED'
    | 'DELETED'
    | 'UNDELIV'
    | 'UNKNOWN'
    | 'REJECTD';
  dlr_date: string; // example: 2015-06-02 01:43:49
}

export async function insert(smsArray: DeliveryReport[]) {
  console.log('[SmspubliService][insert]', smsArray);

  // Convert date strings to Date objects and rename `sms_id` to `id`
  const processedSmsArray = smsArray.map((sms) => ({
    ...sms,
    id: sms.sms_id,
    sms_date: new Date(sms.sms_date),
    dlr_date: new Date(sms.dlr_date),
  }));

  await SmspubliReport.bulkCreate(processedSmsArray, {
    updateOnDuplicate: [
      'from',
      'to',
      'custom',
      'sms_date',
      'status',
      'dlr_date',
    ],
  });
}
