'use strict';

const _ = require('lodash');
const moment = require('moment');
const crypto = require('crypto');
const IbanValidator = require('iban');

const extraConfigForOtherCtry = {
  CH: {
    PstlAdr: { PstCd: '3001', Ctry: 'CH', AdrLine: ['MUOLEN', 'BERN'] },
  },
  AD: {
    PstlAdr: {
      PstCd: 'AD500',
      Ctry: 'AD',
      AdrLine: ['MERITXELL', 'ANDORRA LA VELLA'],
    },
  },
  GB: {
    PstlAdr: {
      PstCd: 'SN38 1NW',
      Ctry: 'GB',
      AdrLine: ['PO BOX 8888 Nationwide House', 'Pipers Way, Swindon'],
    },
  },
};

class SepaSDD {
  constructor(config) {
    this.config = config;
    this.paymentsXmlObj = [];
  }

  async isValidConfig() {
    const requiredFields = ['name', 'IBAN', 'batch', 'creditor_id', 'currency'];
    const functions = {
      IBAN: 'validateIBAN',
      BIC: 'validateBIC',
      batch: 'validateBatch',
    };

    for (const requiredField of requiredFields) {
      if (!this.config[requiredField] || this.config[requiredField] == '') {
        return requiredField + ' is required!';
      }
    }

    for (const functionality in functions) {
      if (_.has(this.config, functionality)) {
        if (
          (await this.validateFunctionality(
            functions[functionality],
            this.config[functionality],
          )) !== true
        ) {
          return `${functionality} does not validate.`;
        }
      }
    }

    this.prepareDocument();
    this.createGroupHeader();

    return true;
  }

  async validateFunctionality(functionality, data_to_validate) {
    switch (functionality) {
      case 'validateIBAN': {
        const ibanValidate = this.validateIBAN(data_to_validate);
        if (!ibanValidate) {
          return 'IBAN is not valid!';
        }
        return true;
      }
      case 'validateBIC': {
        return this.validateBIC(data_to_validate);
      }
      case 'validateBatch': {
        return typeof data_to_validate === 'boolean';
      }
      default:
        return false;
    }
  }

  validateBIC(bic) {
    if (this?.config?.validate === false) {
      return true;
    }
    const bicRegex = new RegExp(
      '([a-zA-Z]{4}[a-zA-Z]{2}[a-zA-Z0-9]{2}([a-zA-Z0-9]{3})?)',
    );
    if (bicRegex.test(bic)) {
      return true;
    }
    return false;
  }

  prepareDocument() {
    this.document_config = {};
    if (this.config.version && this.config.version == '3') {
      this.document_config['@xmlns'] =
        'urn:iso:std:iso:20022:tech:xsd:pain.008.001.03';
    } else {
      this.document_config['@xmlns'] =
        'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02';
    }

    this.document_config['@xmlns:xsi'] =
      'http://www.w3.org/2001/XMLSchema-instance';
  }

  validatePayment(payment) {
    const requiredFields = [
      'name',
      'IBAN',
      'amount',
      'type',
      'collection_date',
      'mandate_id',
      'mandate_date',
      'description',
    ];

    for (const key of requiredFields) {
      if (key in payment && !payment[key]) {
        return key + ' is required!';
      }
    }

    const requiredFunctions = {
      IBAN: this.validateIBAN,
      BIC: this.validateBIC,
      type: this.validateDDType,
      end_to_end_id: this.validateEndToEndId,
    };

    for (const [target, validateFunctions] of Object.entries(
      requiredFunctions,
    )) {
      if (target in payment) {
        const result = validateFunctions(payment[target]);
        if (result === true) continue;
        else return `${target} does not validate.`;
      }
    }
    return true;
  }

  validateIBAN(iban) {
    return IbanValidator.isValid(iban) ? true : `invalid iban ${iban}`;
  }

  validateDDType(type) {
    const types = ['FRST', 'RCUR', 'FNAL', 'OOFF'];
    return types.includes(type)
      ? true
      : `${type} is not a valid Sepa Direct Debit Transaction Type.`;
  }

  validateEndToEndId(end_to_end_id) {
    // eslint-disable-next-line no-control-regex
    const isASCII = /^[\x00-\x7F]*$/.test(end_to_end_id);
    if (isASCII && end_to_end_id.length < 36) {
      return true;
    } else if (!isASCII) {
      return `${end_to_end_id} is not ASCII`;
    } else {
      return `${end_to_end_id} is longer than 35 characters`;
    }
  }

  createGroupHeader() {
    this.group_header = {
      GrpHdr: {
        MsgId: this.makeMsgId(),
        CreDtTm: moment().format('YYYY-MM-DDTHH:mm:ss'),
        NbOfTxs: '',
        CtrlSum: 0,
        InitgPty: {
          Nm: this.config.name,
          Id: {
            PrvtId: {
              Othr: {
                Id: this.config.creditor_id,
                SchmeNm: {
                  Prtry: 'SEPA',
                },
              },
            },
          },
        },
      },
    };
  }

  makeMsgId() {
    let random = crypto
      .createHash('md5')
      .update(Math.floor(100000000 + Math.random() * 900000000) + '')
      .digest('hex');
    random = random.substring(0, 12);
    const timestamp = moment().format('DDMMYYYYmmss');
    return timestamp + '-' + random;
  }

  addPayment(payment) {
    const validationResult = this.validatePayment(payment);
    if (validationResult !== true)
      throw new Error(`Invalid Payment, error with: ${validationResult}`);

    const ctry = payment.IBAN.substring(0, 2);

    let dbtrAgt = {
      Othr: {
        Id: 'NOTPROVIDED',
      },
    };

    if (ctry.toUpperCase() !== 'ES' && payment.BIC) {
      dbtrAgt = { BIC: payment.BIC };
    }

    const paymentXmlObj = {
      PmtId: {
        EndToEndId: this.makeId(),
      },
      InstdAmt: {
        '@Ccy': this.config.currency,
        '#': payment.amount,
      },
      DrctDbtTx: {
        MndtRltdInf: {
          MndtId: payment.mandate_id,
          DtOfSgntr: payment.mandate_date,
        },
      },
      DbtrAgt: {
        FinInstnId: dbtrAgt,
      },
      Dbtr: {
        Nm: payment.name,
        ...this.getConfigByCtry(ctry),
      },
      DbtrAcct: {
        Id: {
          IBAN: payment.IBAN,
        },
      },
      RmtInf: {
        Ustrd: payment.description,
      },
    };

    this.paymentsXmlObj.push({ ...paymentXmlObj });
  }

  getPstlAdr(payment) {
    const PstlAdr = { Ctry: payment.IBAN.substring(0, 2) };
    if (payment.invoice_client.postalCode)
      PstlAdr.PstCd = payment.invoice_client.postalCode;

    if (payment.invoice_client.city)
      PstlAdr.AdrLine = [payment.invoice_client.city];

    if (payment.invoice_client.address)
      Array.isArray(PstlAdr.AdrLine)
        ? PstlAdr.AdrLine.push(payment.invoice_client.address)
        : [payment.invoice_client.address];
    return PstlAdr;
  }

  sepagenerateFile(payment) {
    let finalObj = { Document: {} };
    finalObj.Document = this.document_config;
    let cdtrAgt = {};

    if (this.config.BIC) {
      if (this.config.version && this.config.version == '3') {
        cdtrAgt = { BICFI: this.config.BIC };
      } else {
        cdtrAgt = { BIC: this.config.BIC };
      }
    } else {
      cdtrAgt = {
        Othr: {
          Id: 'NOTPROVIDED',
        },
      };
    }

    let PmtInf = {};
    if (!this.config.batch) {
      PmtInf = {
        PmtInfId: this.makeId(),
        PmtMtd: 'DD',
        BtchBookg: 'false',
        NbOfTxs: '1',
        CtrlSum: Number(payment.amount).toFixed(2),
        PmtTpInf: {
          SvcLvl: {
            Cd: 'SEPA',
          },
          LclInstrm: {
            Cd: 'CORE',
          },
          SeqTp: payment.type,
        },
        ReqdColltnDt: payment.collection_date,
        Cdtr: {
          Nm: this.config.name,
        },
        CdtrAcct: {
          Id: {
            IBAN: this.config.IBAN,
          },
        },
        CdtrAgt: {
          FinInstnId: cdtrAgt,
        },
        ChrgBr: 'SLEV',
        CdtrSchmeId: {
          Nm: this.config.name,
          Id: {
            PrvtId: {
              Othr: {
                Id: this.config.creditor_id,
                SchmeNm: {
                  Prtry: 'SEPA',
                },
              },
            },
          },
        },
      };
    } else {
      PmtInf = this.getBatch(payment.type, payment.collection_date);
    }
    const total = this.calcTotalAmount(this.paymentsXmlObj);
    if (!this.config.batch) {
      PmtInf = {
        ...PmtInf,
        DrctDbtTxInf: this.paymentsXmlObj,
      };
    } else {
      PmtInf.PmtInf.CtrlSum = total;
      PmtInf.PmtInf.NbOfTxs = this.paymentsXmlObj.length;

      PmtInf = {
        ...PmtInf.PmtInf,
        DrctDbtTxInf: this.paymentsXmlObj,
      };
    }

    this.group_header.GrpHdr.NbOfTxs = this.paymentsXmlObj.length;
    this.group_header.GrpHdr.CtrlSum = total;

    finalObj = {
      ...finalObj,
      Document: {
        ...finalObj.Document,
        CstmrDrctDbtInitn: {
          ...this.group_header,
          PmtInf,
        },
      },
    };

    return finalObj;
  }

  getBatch(type, date) {
    let cdtrAgt = {};

    if (this.config.BIC) {
      if (this.config.version && this.config.version == '3') {
        cdtrAgt = { BICFI: this.config.BIC };
      } else {
        cdtrAgt = { BIC: this.config.BIC };
      }
    } else {
      cdtrAgt = {
        Othr: {
          Id: 'NOTPROVIDED',
        },
      };
    }

    let result = {};
    result = {
      PmtInf: {
        PmtInfId: this.makeId(),
        PmtMtd: 'DD',
        BtchBookg: 'true',
        NbOfTxs: 0,
        CtrlSum: 0,
        PmtTpInf: {
          SvcLvl: {
            Cd: 'SEPA',
          },
          LclInstrm: {
            Cd: 'CORE',
          },
          SeqTp: type,
        },
        ReqdColltnDt: date,
        Cdtr: {
          Nm: this.config.name,
        },
        CdtrAcct: {
          Id: {
            IBAN: this.config.IBAN,
          },
        },
        CdtrAgt: {
          FinInstnId: cdtrAgt,
        },
        ChrgBr: 'SLEV',
        CdtrSchmeId: {
          Nm: this.config.name,
          Id: {
            PrvtId: {
              Othr: {
                Id: this.config.creditor_id,
                SchmeNm: {
                  Prtry: 'SEPA',
                },
              },
            },
          },
        },
      },
    };
    return result;
  }

  calcTotalAmount(trxAmountArray) {
    let total = 0;
    for (const x of trxAmountArray) {
      total += Number(x.InstdAmt['#']);
    }

    return Number(total).toFixed(2);
  }

  getConfigByCtry(ctry) {
    if (['CH', 'AD', 'GB'].includes(ctry)) return extraConfigForOtherCtry[ctry];
    return {};
  }

  makeId() {
    let random = crypto
      .createHash('md5')
      .update(Math.floor(100000000 + Math.random() * 900000000) + '')
      .digest('hex');
    random = random.substring(0, 12);
    let name = this.config.name;
    if (name.length > 22) {
      name = name.substring(0, 22);
    }

    return name + '-' + random;
  }
}

module.exports.SepaSDD = SepaSDD;
