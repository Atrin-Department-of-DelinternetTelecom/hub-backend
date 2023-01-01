import { AnyModel, intranet } from '@models';
import { Close, Tick } from '../components/Icons';
import { DelinternetInfo, Footer } from '../components/Footer';
import { GfDocStorage, assertGfStorage } from '../storages/GfDocStorage';
import { Signature, SignatureContainer } from '../components/Signature';

import { App } from '../components/App';
import { ContractConditions } from '../components/ContractConditions';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import GeoGoufoneService from '@service/intranet/GeoGoufoneService';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Observation } from '../components/Observation';
import { PersonalInfo } from '../components/PersonalInfo';
import { Section } from '../components/Section';
import _ from 'lodash';
import assert from 'assert';
import { getDelSignature } from '../assets';
import { h } from 'nano-jsx';

const {
  GfContract,
  GfContractDataFix,
  GfFeeGroup,
  GfSection,
  GfFee,
  GfClient,
  GfContractDataInternet,
} = intranet;

class AltaFixRenderer extends JsxRenderer {
  clientAddressLine1!: string;
  installationAddress: {
    line1: string;
    address: string;
    postalCodeCodeName: string;
    cityCodename: string;
    provinceCodeName: string;
  } | null = null;
  dataFix!: {
    number: string;
    portability: 0 | 1;
    dataInternet?: AnyModel;
  };
  fee!: {
    name: string;
    description: string;
  };
  client!: any;
  sign!: Buffer | null;
  delSignature!: Buffer | null;
  observation!: string | null;
  isCallForwarded = false;

  async loadProps(): Promise<void> {
    assertGfStorage(this.storage);
    const { clientId, contractId } = this.storage.gfDoc;
    assert(contractId);

    const client = await GfClient.findByPk(clientId);
    assert(client, `Client with id:${clientId} not found`);
    this.client = client as any;

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
          model: GfContractDataFix,
          as: 'dataFix',
          required: true,
          include: [
            {
              model: GfContractDataInternet,
              as: 'dataInternet',
              required: false,
            },
          ],
        },
      ],
    });
    assert(contract, `Contract with id:${contractId} not found`);

    this.fee = contract.fee_group;
    this.dataFix = contract.dataFix;
    this.isCallForwarded = contract.fee_group.gf_fees[0]?.isCallForwarded();
    const dataInternet: AnyModel | undefined = contract.dataFix.dataInternet;
    if (dataInternet) {
      const installationAddress = GeoGoufoneService.getFormatedAddress(
        dataInternet,
        true,
      );

      this.installationAddress = {
        line1: installationAddress.line1,
        ...(installationAddress.values as any),
      };
    }

    const clientAddress = GeoGoufoneService.getFormatedAddress(client, true);

    this.clientAddressLine1 = clientAddress.line1;

    this.sign = await this.storage.getSignature('default');
    this.delSignature = await getDelSignature();
    this.observation = this.storage.gfDoc.comments;
  }

  getTitle() {
    return 'Alta fixe';
  }

  getPdfName() {
    return _.kebabCase(`${this.client.name}-${this.getTitle()}`);
  }

  checkBaseDataIsComplete() {
    if (!this.dataFix.number) {
      return 'The fixed number was not provided';
    }

    if (!this.isCallForwarded && !this.dataFix.dataInternet) {
      return 'contract fix section is not connected to internet section';
    }

    return true;
  }

  render(): JSX.IntrinsicElements {
    const { client } = this;

    return (
      <App>
        <Section>
          <Header
            title="Contracte"
            sideText="Prestació de servei de telefonia fixa"
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
            sideText="Prestació de servei de telefonia fixa"
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
    const { fee, installationAddress } = this;

    return (
      <div class="d-flex flex-column px-2">
        <h2>Servei Contractat</h2>
        <div class="d-flex flex-wrap">
          <div class="d-flex flex-column mb-2 w-100">
            <label class="text-gray uppercase">Tarifa</label>
            <p>{fee.name}</p>
          </div>
          <div class="d-flex flex-column mb-2 w-75">
            <label class="text-gray uppercase">Adreça d'instal·lació</label>
            <p>{installationAddress?.line1 ?? '-'}</p>
          </div>
          <div class="d-flex flex-column mb-2 w-25">
            <label class="text-gray uppercase">Codi Postal</label>
            <p>{installationAddress?.postalCodeCodeName ?? '-'}</p>
          </div>
          <div class="d-flex flex-column mb-2 w-75">
            <label class="text-gray uppercase">Localitat</label>
            <p>{installationAddress?.cityCodename ?? '-'}</p>
          </div>

          <div class="d-flex flex-column mb-2 w-25">
            <label class="text-gray uppercase">Provincia</label>
            <p>{installationAddress?.provinceCodeName ?? '-'}</p>
          </div>
          <div class="d-flex w-1/3">
            <div class="d-flex flex-column">
              <label class="text-gray uppercase">Portabilitat</label>
              <div class="d-flex align-center">
                {this.dataFix.portability ? <Tick /> : <Close />}
                {/* <p class="px-1/2">del número de telèfon</p> */}
              </div>
            </div>
          </div>
          <div class="d-flex flex-column w-1/3">
            <div class="d-flex flex-column">
              <label class="text-gray uppercase">Numeració nova</label>
              <div class="d-flex align-center">
                {!this.dataFix.portability ? <Tick /> : <Close />}
                {/* <p class="px-1/2">del número de telèfon</p> */}
              </div>
            </div>
          </div>
          <div class="d-flex flex-column mb-1/5 w-1/3">
            <label class="text-gray uppercase">Número de fix</label>
            <p>{this.dataFix.number}</p>
          </div>
          <div class="box_gran w-100">
            <label class="text-gray uppercase">Característiques</label>
            <div dangerouslySetInnerHTML={{ __html: this.fee.description }} />
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
  type: 'alta_fix',
  storageType: 'Goufone-Documents-AltaFix',
  initTitle: 'Alta fixe',
  signatures: ['default'],
  loadDetail,
  Storage: GfDocStorage,
  Renderer: AltaFixRenderer,
});
