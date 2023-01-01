import { DelinternetInfo, Footer } from '../components/Footer';
import { Signature, SignatureContainer } from '../components/Signature';
import { intranet, system } from '@models';

import { App } from '../components/App';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Section } from '../components/Section';
import { TYPE } from '@api/constants/documents';
import assert from 'assert';
import { get } from 'lodash';
import { getDelSignature } from '../assets';
import { h } from 'nano-jsx';
import { trainCase } from 'case-anything';

const { ClientAgreement } = system;

class ClientAgreementRenderer extends JsxRenderer {
  signs: {
    client?: Buffer;
    operator?: Buffer;
    delSignature?: Buffer;
  } = {};
  client_agreement: any;
  async loadProps() {
    this.client_agreement = await ClientAgreement.findOne({
      where: {
        doc_id: this.storage.id,
      },
      include: [
        {
          model: intranet.GfContract,
          required: true,
          as: 'contract',
          include: [
            {
              model: intranet.GfClient,
              required: true,
              as: 'client',
              attributes: [
                'addressCity',
                'name',
                'fiscalId',
                'addressStreet',
                'addressPostalCode',
                'addressCity',
                'addressProvince',
                'contactPhone',
                'addressNumber',
                'emailAddress',
              ],
            },
            {
              model: intranet.GfFeeGroup,
              required: false,
              as: 'fee_group',
            },
          ],
        },
      ],
    });

    assert(this.client_agreement);
    try {
      this.signs = await this.loadSignatures();
    } catch (error) {
      return;
    }
  }
  getPdfName() {
    return trainCase(`ClientAgreement`);
  }

  render() {
    return (
      <App>
        <Section>
          <Header title="Acord del client" />
          <this.Content />

          <Footer>
            <SignatureContainer>
              <Signature
                label="Firma autorització del propietari"
                signature={this.signs.client || null}
              />
              <Signature
                label="Firma del titular"
                signature={this.signs.operator || null}
              />
              <Signature
                label="DEL-INTERNET TELECOM S.L.U (Delinternet)"
                signature={this.signs.delSignature || null}
              />
            </SignatureContainer>
            <DelinternetInfo />
          </Footer>
        </Section>
      </App>
    );
  }

  async loadSignatures() {
    return {
      client: (await this.storage.getSignature('client'))!,
      operator: (await this.storage.getSignature('operator'))!,
      delSignature: (await getDelSignature())!,
    };
  }

  Content = () => {
    return (
      <div class="d-flex flex-column px-2">
        <div class="d-flex flex-wrap pt-2 ">
          {Object.entries(PropertiesToRender).map(([key, value]) => {
            return <this.DataGroup group={value} groupKey={key} />;
          })}
        </div>
      </div>
    );
  };

  DataGroup = ({ group, groupKey }: { group: Group; groupKey: string }) => {
    return (
      <div class="d-flex flex-column w-100">
        <h2 class="w-100">{group.translation}</h2>
        <div class="d-flex flex-wrap w-auto">
          {Object.entries(group.props).map(([key, value]: any) => {
            return (
              <GeneralData k={value} v={get(this.client_agreement, key)} />
            );
          })}
        </div>
      </div>
    );
  };
}

const GeneralData = ({ k, v }: { k: string; v: string | Date }) => (
  <div class="d-flex flex-column w-1/3 mb-1 p-1">
    <label class="text-gray uppercase w-auto">{k}</label>
    <p>{v ? (v instanceof Date ? formatDate(v) : v) : '-'}</p>
  </div>
);
function formatDate(date: Date) {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
type Group = { translation: string; props: Record<string, string> };
const PropertiesToRender: Record<string, Group> = {
  general_info: {
    translation: 'Dades del titular',
    props: {
      'contract.client.name': 'NOM DEL TITULAR / RAÓ SOCIAL',
      'contract.client.fiscalId': 'DNI/NIF/NIE',
      'contract.client.contactPhone': 'telèfon 1',
      'contract.client.emailAddress': 'correu electrònic',
      'contract.client.addressProvince': 'provincia',
      'contract.client.addressCity': 'localitat',
      'contract.client.addressStreet': 'ADREÇA DE FACTURACIÓ',
      'contract.client.addressPostalCode': 'codi postal',
      'contract.client.addressNumber': "número d'adreça",
    },
  },
  agreement: {
    translation: 'Detalls del contracte',
    props: {
      'contract.fee_group.name': 'Tarifa',
      end_of_permanence: 'fi de la permanència',
      permanence_fine: 'multa de permanència',
      number_of_payments: 'nombre de pagaments',
      payment_value: 'valor de pagament',
    },
  },
};
async function loadDetail(storage: DocumentStorage) {
  const clientAgreement = await ClientAgreement.findOne({
    where: {
      doc_id: storage.id,
    },
  });
  assert(
    clientAgreement,
    `Client agreement with docId:${storage.id} not found`,
  );

  return {
    client_registration_id: clientAgreement.id,
  };
}
export default new Document({
  type: 'client_registration',
  storageType: TYPE.CLIENT_AGREEMENT,
  initTitle: 'Client agreement',
  signatures: ['operator', 'client'],
  loadDetail,
  Storage: DelinternetStorage,
  Renderer: ClientAgreementRenderer,
});
