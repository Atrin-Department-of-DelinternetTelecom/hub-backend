import { AnyModel, intranet } from '@models';
import { DelinternetInfo, Footer } from '../components/Footer';
import { Signature, SignatureContainer } from '../components/Signature';

import { App } from '../components/App';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import GeoGoufoneService from '@service/intranet/GeoGoufoneService';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Section } from '../components/Section';
import assert from 'assert';
import { getDelSignature } from '../assets';
import { h } from 'nano-jsx';
import { trainCase } from 'case-anything';

const { GfClient, GfContract, GfContractHolderChange, GfFeeGroup, GfSection } =
  intranet;

class ChangeHolderRenderer extends JsxRenderer {
  fromClient!: AnyModel;
  toClient!: AnyModel;
  contract!: AnyModel;
  toClientAddress!: string;
  fromClientAddress!: string;
  signs: {
    toClient?: Buffer;
    fromClient?: Buffer;
  } = {};
  delSignature!: Buffer | null;

  async loadProps() {
    const storage = this.storage;

    const changeHolder = await GfContractHolderChange.findOne({
      where: {
        docId: storage.id,
      },
      include: [
        {
          model: GfClient,
          as: 'fromClient',
        },
        {
          model: GfClient,
          as: 'toClient',
        },
        {
          model: GfContract,
          as: 'contract',
          required: false,
        },
      ],
    });
    assert(changeHolder);

    this.signs = await this.loadSignatures();
    this.delSignature = await getDelSignature();

    this.toClient = changeHolder.toClient;
    this.fromClient = changeHolder.fromClient;
    this.contract = changeHolder.contract;

    this.toClientAddress = GeoGoufoneService.getFormatedAddress(
      this.toClient,
      true,
    ).line1;
    this.toClientAddress = GeoGoufoneService.getFormatedAddress(
      this.fromClient,
      true,
    ).line1;
  }

  getTitle() {
    return `Change Holder`;
  }

  checkBaseDataIsComplete() {
    return true as const;
  }

  getPdfName() {
    return trainCase(
      `${this.toClient.name} ${this.storage.type}`.replaceAll('-', ' '),
    );
  }

  render() {
    return (
      <App>
        <Section>
          <Header
            title="Canvi TITULAR"
            sideText="Ordre de domiciiació directe Change Holder"
          />
          <this.Content />
          <Footer>
            <SignatureContainer>
              <Signature
                label="Firma titular que demana la baixa"
                signature={this.signs.fromClient ?? null}
                date={this.storage.signatureUploadedDate}
              />
              <Signature
                label="Firma del nou titular"
                signature={this.signs.toClient ?? null}
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
      </App>
    );
  }

  async loadSignatures() {
    return {
      toClient: (await this.storage.getSignature('toClient'))!,
      fromClient: (await this.storage.getSignature('fromClient'))!,
    };
  }

  Content = () => {
    const { toClient, toClientAddress, contract, fromClient } = this;

    return (
      <div class="d-flex flex-column px-2">
        <h2 class="pb-1">Titular nou</h2>
        <div class="d-flex flex-wrap pt-2">
          <GeneralData k="Nom i Cognoms" v={toClient.name} />
          <GeneralData k="DNI" v={toClient.fiscalId} />
          <GeneralData k="Població" v={toClient.addressCity} />
          <GeneralData k="Adreça" v={toClientAddress} />
          <GeneralData k="Codi Postal" v={toClient.postalCode} />
          <GeneralData k="Data Naixement" v={format(toClient.birthday)} />
          <GeneralData k="Telèfon de contacte" v={toClient.contactPhone} />
          <GeneralData k="Servei Contractat" v={contract.reference} />
          <GeneralData k="Nº de Compte" v={toClient.fiscalId} />
        </div>
        <h2 class="pb-1">Titular actual</h2>
        <div class="d-flex flex-wrap pt-2">
          <GeneralData k="Nom i Cognoms" v={fromClient.name} />
          <GeneralData k="DNI" v={fromClient.fiscalId} />
          <GeneralData k="Telèfon de contacte" v={fromClient.contactPhone} />
        </div>
      </div>
    );
  };
}

const GeneralData = ({ k, v }: { k: string; v: string }) => (
  <div class="d-flex flex-column mb-1 w-50">
    <label class="text-gray uppercase">{k}</label>
    <p>{v ?? '-'}</p>
  </div>
);

function format(date: Date) {
  if (!date) return '-';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function loadDetail(storage: DocumentStorage) {
  const changeHolder = await GfContractHolderChange.findOne({
    where: {
      docId: storage.id,
    },
    include: [
      {
        model: GfClient,
        as: 'fromClient',
      },
      {
        model: GfClient,
        as: 'toClient',
      },
    ],
  });
  assert(changeHolder);

  const contract = await GfContract.findByPk(changeHolder.contractId, {
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
  assert(contract);

  const section = contract.fee_group?.sections[0];

  return {
    changeHolder: {
      id: changeHolder.id,
      state: changeHolder.state,
    },
    contract: {
      id: contract.id,
      reference: contract.reference,
      state: contract.state,
      type: section.code,
      clientId: contract.clientId,
    },
    fromClient: {
      id: changeHolder.fromClient.id,
      name: changeHolder.fromClient.name,
    },
    toClient: {
      id: changeHolder.toClient.id,
      name: changeHolder.toClient.name,
    },
  };
}

export default new Document({
  type: 'change_holder',
  storageType: 'Delinternet-Documents-ChangeHolder',
  initTitle: 'Change Holder',
  signatures: ['toClient', 'fromClient'],
  loadDetail,
  Storage: DelinternetStorage,
  Renderer: ChangeHolderRenderer,
});
