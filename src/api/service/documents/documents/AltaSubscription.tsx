import { DelinternetInfo, Footer } from '../components/Footer';
import { GfDocStorage, assertGfStorage } from '../storages/GfDocStorage';
import { Signature, SignatureContainer } from '../components/Signature';

import { App } from '../components/App';
import { ContractConditions } from '../components/ContractConditions';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import GeoGoufoneService from '@service/intranet/GeoGoufoneService';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Observation } from '../components/Observation';
import { PersonalInfo } from '../components/PersonalInfo';
import { Section } from '../components/Section';
import _ from 'lodash';
import assert from 'assert';
import { getDelSignature } from '../assets';
import { h } from 'nano-jsx';
import { intranet } from '@models';

const { GfContract, GfFeeGroup, GfFee, GfSection } = intranet;

class AltaSubscriptionRenderer extends JsxRenderer {
  clientAddressLine1!: string;
  client!: GfClient;
  fee!: {
    name: string;
    description: string;
  };
  sign!: Buffer | null;
  delSignature!: Buffer | null;
  observation!: string | null;

  async loadProps() {
    assertGfStorage(this.storage);
    const { clientId, contractId } = this.storage.gfDoc;
    assert(contractId);

    const client = await GfClient.findByPk(clientId);
    assert(client, `Client with id:${clientId} not found`);

    this.client = client;
    const clientAddress = GeoGoufoneService.getFormatedAddress(client, true);
    this.clientAddressLine1 = clientAddress.line1;

    const contract = await GfContract.findByPk(contractId, {
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          include: [
            {
              model: GfFee,
              as: 'gf_fees',
            },
          ],
          required: true,
        },
      ],
    });
    assert(contract, `Contract with id:${contractId} not found`);

    this.fee = contract.fee_group;
    this.sign = await this.storage.getSignature('default');
    this.delSignature = await getDelSignature();
    this.observation = this.storage.gfDoc.comments;
  }

  getTitle() {
    return `Alta Subscription (${this.fee.name})`;
  }

  getPdfName() {
    return _.kebabCase(`${this.client.name}-${this.getTitle()}`);
  }

  render(): JSX.IntrinsicElements {
    const { client } = this;

    return (
      <App>
        <Section>
          <Header
            title="Contracte"
            sideText="Prestació de servei de televisió digital"
          />
          <PersonalInfo
            name={client.name}
            dni={client.fiscalId}
            address={this.clientAddressLine1}
            addressPostalCodeCodeName={client.addressPostalCodeCodeName}
            addressCityCodeName={client.addressCityCodeName}
            addressProvinceCodeName={client.addressProvinceCodeName}
            phone1={client.contactPhone}
            email={client.emailAddress}
          />
          <this.ContractContent />
          <Footer>
            <SignatureContainer>
              <Observation observation={this.observation} />
              <Signature
                label="Signatura de l'usuari"
                signature={this.sign}
                date={this.storage.signatureUploadedDate}
              />
              <Signature
                label="DEL-INTERNET TELECOM S.L.U (Delinternet)"
                signature={this.delSignature}
              />
            </SignatureContainer>
            <DelinternetInfo />
          </Footer>
        </Section>

        <Section>
          <Header
            title="Contracte"
            sideText="Prestació de servei de televisió digital"
          />
          <ContractConditions />
          <Footer>
            <DelinternetInfo />
          </Footer>
        </Section>
      </App>
    );
  }

  ContractContent = () => {
    return (
      <div class="d-flex flex-column px-2">
        <h2>Servei Contractat</h2>
        <div class="d-flex flex-wrap">
          <div class="d-flex flex-column">
            <label class="text-gray uppercase">Tarifa</label>
            <p>{this.fee.name}</p>
          </div>
        </div>
      </div>
    );
  };
}

async function loadDetail(storage: DocumentStorage) {
  assertGfStorage(storage);
  const contractId = storage.gfDoc.contractId!;
  const contract = await GfContract.findByPk(contractId, {
    include: [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: true,
          },
        ],
        required: true,
      },
    ],
  });
  assert(contract, `Contract with id:${contractId} not found`);
  const section = contract.fee_group?.sections[0];

  return {
    clientId: storage.gfDoc.clientId,
    contract: {
      id: contract.id,
      reference: contract.reference,
      type: section.code,
    },
  };
}

export default new Document({
  type: 'alta_subscription',
  storageType: 'Goufone-Documents-AltaSubscription',
  initTitle: 'Alta SUBSCRIPTION',
  signatures: ['default'],
  loadDetail,
  Storage: GfDocStorage,
  Renderer: AltaSubscriptionRenderer,
});
