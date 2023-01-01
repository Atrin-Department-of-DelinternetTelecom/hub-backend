import { DelinternetInfo, Footer } from '../components/Footer';
import { Signature, SignatureContainer } from '../components/Signature';

import { App } from '../components/App';
import { ChangeBankNumber } from '@api/models/global/global_change_bank_number';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Section } from '../components/Section';
import assert from 'assert';
import { getDelSignature } from '../assets';
import { h } from 'nano-jsx';
import { intranet } from '@models';
import { trainCase } from 'case-anything';

const { GfClient } = intranet;

const GeneralData = ({ k, v }: { k: string; v: string }) => (
  <div class="d-flex flex-column mb-1 w-100">
    <label class="text-gray uppercase">{k}</label>
    <p>{v ?? '-'}</p>
  </div>
);

class ChangeIbanRenderer extends JsxRenderer {
  entity!: ChangeBankNumber;
  sign!: Buffer | null;
  delSignature!: Buffer | null;

  async loadProps() {
    const storage = this.storage;

    const entity = await ChangeBankNumber.findOne({
      where: {
        doc_id: storage.id,
      },
      include: [
        {
          model: GfClient,
          as: 'client',
        },
      ],
    });
    assert(entity);
    this.entity = entity;

    this.sign = await this.storage.getSignature('default');
    this.delSignature = await getDelSignature();
  }

  getTitle() {
    return `Change Iban`;
  }

  getPdfName() {
    return trainCase(`${this.entity.client!.name} Change Iban`);
  }

  render() {
    return (
      <App>
        <Section>
          <Header title="Sol·licitud canvi compte corrent" />
          <this.Content />
          <Footer>
            <SignatureContainer>
              <Signature
                label="Firma titular"
                signature={this.sign ?? null}
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

  Content = () => {
    const { entity } = this;

    return (
      <div class="d-flex flex-column px-2">
        <div class="d-flex flex-wrap pt-2">
          <GeneralData k="Nom i Cognoms" v={entity.client!.name} />
          <GeneralData k="DNI" v={entity.client!.fiscalId} />
          <GeneralData k="Número de compte corrent nou" v={entity.iban} />
        </div>
      </div>
    );
  };
}

async function loadDetail(storage: DocumentStorage) {
  const entity = await ChangeBankNumber.findOne({
    where: {
      doc_id: storage.id,
    },
  });
  assert(entity);

  return {
    changeIbanId: entity.id,
    clientId: entity.gf_client_id,
    iban: entity.iban,
    bic: entity.bic,
    bank: entity.bank,
  };
}

export default new Document({
  type: 'change_iban',
  storageType: 'Delinternet-Documents-ChangeIBAN',
  initTitle: 'Change Iban',
  signatures: ['default'],
  loadDetail,
  Storage: DelinternetStorage,
  Renderer: ChangeIbanRenderer,
});
