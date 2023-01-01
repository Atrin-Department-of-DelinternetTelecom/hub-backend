import { DelinternetInfo, Footer } from '../components/Footer';
import { GfDocStorage, assertGfStorage } from '../storages/GfDocStorage';
import {
  InitialFeeProps,
  InitialFeeSection,
} from '../components/InitialFeeSection';
import { Signature, SignatureContainer } from '../components/Signature';

import { App } from '../components/App';
import { ContractConditions } from '../components/ContractConditions';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import GeoGoufoneService from '@service/intranet/GeoGoufoneService';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { Header } from '../components/Header';
import { InitialFee } from '@api/models/intranet/intranet_initial_fee';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Observation } from '../components/Observation';
import { PersonalInfo } from '../components/PersonalInfo';
import { Section } from '../components/Section';
import _ from 'lodash';
import assert from 'assert';
import { getDelSignature } from '../assets';
import { h } from 'nano-jsx';
import { intranet } from '@models';

const { GfContract, GfContractDataInternet, GfFeeGroup, GfSection, GfFee } =
  intranet;

class AltaInternetRenderer extends JsxRenderer {
  clientAddressLine1!: string;
  installationAddressLine1!: string;
  installationAddress!: {
    address: string;
    postalCodeCodeName: string;
    cityCodename: string;
    provinceCodeName: string;
  };
  dataInternet!: {
    addressNumber: string;
    addressPostalCode: string;
    addressProvince: string;
    addressStreet: string;
  };
  fee!: {
    name: string;
  };
  client!: GfClient;
  sign!: Buffer | null;
  delSignature!: Buffer | null;
  observation!: string | null;
  initialFee?: InitialFee;

  async loadProps() {
    assertGfStorage(this.storage);
    const { clientId, contractId } = this.storage.gfDoc;
    assert(contractId);

    const client = await GfClient.findByPk(clientId);
    assert(client, `Client with id:${clientId} not found`);
    this.client = client;

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
            {
              model: GfFee,
              as: 'gf_fees',
            },
          ],
          required: true,
        },
        {
          model: GfContractDataInternet,
          as: 'dataInternet',
          required: true,
        },
        { model: InitialFee, required: false },
      ],
    });
    assert(contract, `Contract with id:${contractId} not found`);
    this.dataInternet = contract.dataInternet;

    this.fee = contract.fee_group;

    const clientAddress = GeoGoufoneService.getFormatedAddress(client, true);

    this.clientAddressLine1 = [clientAddress.line1, clientAddress.line2]
      .filter((val) => val)
      .join('\n');

    const installationAddress = GeoGoufoneService.getFormatedAddress(
      this.dataInternet,
      true,
    );

    this.installationAddressLine1 = [
      installationAddress.line1,
      installationAddress.line2,
    ]
      .filter((val) => val)
      .join(', ');
    this.installationAddress = installationAddress.values as any;

    this.sign = await this.storage.getSignature('default');
    this.delSignature = await getDelSignature();
    this.observation = this.storage.gfDoc.comments;
    this.initialFee = contract.InitialFees?.[0];
  }

  getTitle() {
    return `Alta internet (${this.fee.name})`;
  }

  getPdfName() {
    return _.kebabCase(`${this.client.name}-${this.getTitle()}`);
  }

  render(): JSX.IntrinsicElements {
    return (
      <App>
        <Section>
          <Header
            title="Contracte"
            sideText="Prestació de servei d'accés a internet"
          />
          <this.ContractContent />
          {this.initialFee && <InitialFeeSection {...this.getInitialFee()} />}
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
            sideText="Prestació de servei d'accés a internet"
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
    const { client, fee, installationAddress } = this;

    return (
      <div class="d-flex flex-column">
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
        <div class="d-flex flex-column px-2">
          <h2>Servei Contractat</h2>
          <div class="d-flex flex-wrap">
            <div class="d-flex flex-column mb-2 w-100">
              <label class="text-gray uppercase">Tarifa</label>
              <p>{fee.name}</p>
            </div>
            <div class="d-flex flex-column mb-2 w-75">
              <label class="text-gray uppercase">Adreça d'instal·lació</label>
              <p>{this.installationAddressLine1 ?? '-'}</p>
            </div>
            <div class="d-flex flex-column mb-2 w-25">
              <label class="text-gray uppercase">Codi Postal</label>
              <p>{installationAddress.postalCodeCodeName ?? '-'}</p>
            </div>
            <div class="d-flex flex-column mb-2 w-75">
              <label class="text-gray uppercase">Localitat</label>
              <p>{installationAddress.cityCodename ?? '-'}</p>
            </div>

            <div class="d-flex flex-column mb-2 w-25">
              <label class="text-gray uppercase">Provincia</label>
              <p>{installationAddress.provinceCodeName ?? '-'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  getInitialFee(): InitialFeeProps {
    assert(this.initialFee, 'Missing initial fee information');

    return {
      price: this.initialFee.price,
      name: this.initialFee.name,
      start_date: this.initialFee.ContractInitialFee.start_date,
      end_date: this.initialFee.ContractInitialFee.end_date,
      installments: this.initialFee.ContractInitialFee.installments,
      discount: this.initialFee.ContractInitialFee.discount,
    };
  }
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
  type: 'alta_internet',
  storageType: 'Goufone-Documents-AltaInternet',
  initTitle: 'Alta internet',
  signatures: ['default'],
  loadDetail,
  Storage: GfDocStorage,
  Renderer: AltaInternetRenderer,
});
