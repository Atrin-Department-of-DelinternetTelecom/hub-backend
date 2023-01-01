import { DelinternetInfo, Footer } from '../components/Footer';
import { Signature, SignatureContainer } from '../components/Signature';

import { App } from '../components/App';
import { DataProtectionDocument } from '@api/models/intranet/intranet_data_protection_document';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Section } from '../components/Section';
import { Tick } from '../components/Icons';
import assert from 'assert';
import { getDelSignature } from '../assets';
import { h } from 'nano-jsx';
import { trainCase } from 'case-anything';

class DataProtectionRenderer extends JsxRenderer {
  dataProtection!: DataProtectionDocument;
  client!: GfClient;
  signature!: Buffer | null;
  delSignature!: Buffer | null;
  observation!: string | null;

  async loadProps() {
    const dataProtection = await DataProtectionDocument.findOne({
      where: {
        docId: this.storage.id,
      },
    });
    assert(
      dataProtection,
      `DataProtectionDocument with docId:${this.storage.id} not found`,
    );

    const client = await GfClient.findByPk(dataProtection.clientId);
    assert(client, `Client with id:${dataProtection.clientId} not found`);

    this.client = client;
    this.dataProtection = dataProtection;

    this.signature = await this.storage.getSignature('default');
    this.delSignature = await getDelSignature();
  }

  getPdfName() {
    return trainCase(
      `${this.client.name} ${this.storage.type}`.replaceAll('-', ' '),
    );
  }

  getTitle(): string {
    return 'Dades';
  }

  render(): JSX.IntrinsicElements {
    return (
      <App>
        <Section>
          <Header
            title="Privacitat"
            sideText="Document protecció de dades Delinternet"
          />
          <this.Content />
          <Footer>
            <SignatureContainer>
              <Signature
                label="DEL-INTERNET TELECOM S.L.U (Delinternet)"
                signature={this.delSignature}
              />
              <Signature
                label="Signatura de l'usuari"
                signature={this.signature}
                date={this.storage.signatureUploadedDate}
              />
            </SignatureContainer>
            <DelinternetInfo />
          </Footer>
        </Section>
      </App>
    );
  }

  Content = () => {
    return (
      <div class="d-flex flex-column px-2">
        <h2 class="pb-1">Informació bàsica sobre protecció de dades</h2>
        <div class="d-flex flex-wrap">
          <div class="w-50">
            <h5 class="uppercase text-gray pb-1/2 mb-1/2">
              Dades del responsable
            </h5>
            <p>
              Nom: DEL-INTERNET TELECOM S.L.U
              <br />
              C.I.F: ESB55606446 <br />
              Adreça: Plaça Mercat La Cava 1 Local Delinternet (Deltebre)
              <br />
              Telèfon: 877 990 500
              <br />
            </p>
          </div>
          <div class="w-50">
            <h5 class="uppercase text-gray pb-1/2 mb-1/2">Base Jurídica</h5>
            <p>
              Llei Orgànica 3/2018, de 5 de desembre, de Protecció de Dades
              Personals i garantia dels drets digitals.
            </p>
          </div>
          <div class="w-50">
            <h5 class="uppercase text-gray pb-1/2 mb-1/2">Finalitats</h5>
            <p>
              Gestió de contractació dels serveis contracts amb Delinternet i
              Enviament de publicitat genèrica i personalitzada.
            </p>
          </div>
          <div class="w-50">
            <h5 class="uppercase text-gray pb-1/2 mb-1/2">Legitimació</h5>
            <p>Execució d'un contracte i consentiment de l'interessat.</p>
          </div>
          <div class="w-50">
            <h5 class="uppercase text-gray pb-1/2 mb-1/2">Destinataris</h5>
            <p>No es cediran dades a tercers, exepte obligació legal.</p>
          </div>
          <div class="w-50">
            <h5 class="uppercase text-gray pb-1/2 mb-1/2">Drets</h5>
            <p>
              Accedir, rectificar, suprimir, oposició, dret a la limitació de
              tractament i dret a la portabilitat.
            </p>
          </div>
          <div class="w-50">
            <h5 class="uppercase text-gray pb-1/2 mb-1/2">
              Informació addicional
            </h5>
            <p>
              Podeu consultar la informació addicional i detallada sobre
              Protecció de Dades a la nostra pàgina web:
              https://delinternet.com/proteccio-dades
            </p>
          </div>
        </div>
        <div class="d-flex flex-column py-2">
          <label class="text-gray uppercase">
            Enviament d'ofertes de productes i serveis del seu interès
          </label>
          <div class="d-flex align-center">
            <Tick />
            <p class="px-1/2">
              Si accepta el tractament de les seves dades amb aquesta finalitat
              marqui aquesta casella.
            </p>
          </div>
        </div>
        <small>
          Podrà retirar el seu consentiment en qualsevol moment, si bé això no
          afectarà la legalitat del tractament efectuat amb el consentiment
          previ.
        </small>
      </div>
    );
  };
}

async function loadDetail(storage: DocumentStorage) {
  const dataProtection = await DataProtectionDocument.findOne({
    where: {
      docId: storage.id,
    },
  });
  assert(
    dataProtection,
    `DataProtectionDocument with docId:${storage.id} not found`,
  );

  return {
    clientId: dataProtection.clientId,
  };
}

export default new Document({
  type: 'data_protection',
  storageType: 'Delinternet-Documents-DataProtection',
  initTitle: 'Dades',
  signatures: ['default'],
  loadDetail,
  Storage: DelinternetStorage,
  Renderer: DataProtectionRenderer,
});
