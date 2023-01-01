import { DelinternetInfo, Footer } from '../components/Footer';
import { Signature, SignatureContainer } from '../components/Signature';

import { App } from '../components/App';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import GeoGoufoneService from '@service/intranet/GeoGoufoneService';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Observation } from '../components/Observation';
import { Section } from '../components/Section';
import { SepaDocument } from '@api/models/intranet/intranet_sepa_document';
import assert from 'assert';
import { getDelSignature } from '../assets';
import { h } from 'nano-jsx';
import { intranet } from '@api/models';
import { trainCase } from 'case-anything';

class SepaRenderer extends JsxRenderer {
  sepa!: SepaDocument;
  client!: GfClient;
  address!: string;
  sign!: Buffer | null;
  delSignature!: Buffer | null;
  observation!: string | null;

  async loadProps() {
    const sepa = await SepaDocument.findOne({
      where: {
        docId: this.storage.id,
      },
    });
    assert(sepa, `SepaDocument with docId:${this.storage.id} not found`);

    const client = await GfClient.findByPk(sepa.clientId, {
      include: {
        model: intranet.InvoicePaymentType,
        as: 'paymentType',
        required: false,
      },
    });
    assert(client, `Client with id:${sepa.clientId} not found`);

    this.client = client;
    this.sepa = sepa;

    const { line1 } = GeoGoufoneService.getFormatedAddress(client, true);
    this.address = line1;

    this.sign = await this.storage.getSignature('default');
    this.delSignature = await getDelSignature();
  }

  getPdfName() {
    return trainCase(
      `${this.client.name} ${this.storage.type}`.replaceAll('-', ' '),
    );
  }

  getTitle(): string {
    return 'SEPA';
  }

  render() {
    return (
      <App>
        <Section>
          <Header title="SEPA" sideText="Ordre de domiciiació directe SEPA" />
          <this.Content />
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
                signature={this.delSignature || null}
              />
            </SignatureContainer>
            <DelinternetInfo />
          </Footer>
        </Section>
      </App>
    );
  }

  Content = () => {
    const client = this.client;
    const sepa = this.sepa;

    return (
      <div class="d-flex flex-column px-2">
        <h2 class="pb-1">A complimentar pel creditor</h2>
        <div class="d-flex flex-wrap">
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray uppercase">
              Referència de l’orde de domiciliació
            </label>
            <p>{`C0/${client.id}`}</p>
          </div>
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray uppercase">
              Identificador del creditor
            </label>
            <p>ESB55606446</p>
          </div>
          <div class="d-flex flex-column mb-1 w-100">
            <label class="text-gray uppercase">Nom del creditor</label>
            <p>DEL-INTERNET TELECOM S.L.U</p>
          </div>
          <div class="d-flex flex-column mb-1 w-75">
            <label class="text-gray uppercase">Adreça</label>
            <p>Plaça Mercat La Cava 1 Local Delinternet</p>
          </div>
          <div class="d-flex flex-column mb-1 w-25">
            <label class="text-gray uppercase">Codi Postal</label>
            <p>43580</p>
          </div>
          <div class="d-flex flex-column mb-1/2 w-50">
            <label class="text-gray uppercase">Localitat</label>
            <p>Deltebre</p>
          </div>
          <div class="d-flex flex-column mb-1/2 w-25">
            <label class="text-gray uppercase">Provincia</label>
            <p>Tarragona</p>
          </div>
          <div class="d-flex flex-column mb-1/2 w-25">
            <label class="text-gray uppercase">País</label>
            <p>Espanya</p>
          </div>
        </div>

        <small class="text-gray">
          Mitjançant la signatura d’aquesta ordre de domiciliació el deutor
          autoritza (A) al creditor a enviar instruccions a l’entitat del deutor
          per a carregar en el seu compte, i (B) a l’entitat per a efectuar
          càrrecs en el seu compte seguint les instruccions del creditor. Com a
          part dels seus drets, el deutor està legitimitat al reemborsament per
          la seva entitat en els termes i condicions de contracte subscrit per
          la mateixa. La sol·licitud de reemborsament s’haurà d’efectuar dins de
          les vuit setmanes que segueixen a la data del càrrec en compte. Pot
          obtenir informació addicional sobre els seus drets a la seva entitat
          financera.
        </small>
        <div class="d-flex flex-column">
          <h2 class="pb-1">A complimentar pel deutor</h2>
          <div class="d-flex flex-wrap">
            <div class="d-flex flex-column mb-1 w-75">
              <label class="text-gray uppercase">Nom del deutor/es</label>
              <p>
                {client.sepaName
                  ? `${client.sepaName} ${client.sepaSurname1} ${client.sepaSurname2}`
                  : client.name}
              </p>
            </div>
            <div class="d-flex flex-column mb-1 w-25">
              <label class="text-gray uppercase">DNI/NIE/NIF</label>
              <p>{client.fiscalId}</p>
            </div>
            <div class="d-flex flex-column mb-1 w-75">
              <label class="text-gray uppercase">Adreça del deutor</label>
              <p>{this.address}</p>
            </div>
            <div class="d-flex flex-column mb-1 w-25">
              <label class="text-gray uppercase">Codi Postal</label>
              <p>{client.addressPostalCodeCodeName}</p>
            </div>
            <div class="d-flex flex-column mb-1 w-50">
              <label class="text-gray uppercase">Localitat</label>
              <p>{client.addressCityCodeName}</p>
            </div>
            <div class="d-flex flex-column mb-1 w-25">
              <label class="text-gray uppercase">Provincia</label>
              <p>{client.addressProvinceCodeName}</p>
            </div>
            <div class="d-flex flex-column mb-1 w-25">
              <label class="text-gray uppercase">País</label>
              <p>Espanya</p>
            </div>
            <div class="d-flex flex-column mb-1 w-50">
              <label class="text-gray uppercase">
                Swift BIC (pot contenir 8 o 11 caràcters)
              </label>
              <p>
                {sepa.bic}({sepa.bicName})
              </p>
            </div>
            <div class="d-flex flex-column mb-1 w-50">
              <label class="text-gray uppercase">Número de compte - IBAN</label>
              <p>{sepa.iban}</p>
            </div>

            <div class="d-flex w-50">
              <div class="d-flex flex-column">
                <label class="text-gray uppercase">Pagament Recurrent</label>
                <div class="d-flex align-center">
                  <p>{this.client.paymentType?.name}</p>
                </div>
              </div>
            </div>
            <div class="d-flex flex-column w-50">
              <div class="d-flex flex-column">
                <label class="text-gray uppercase">Pagament Únic</label>
                <div class="d-flex align-center"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
}

async function loadDetail(storage: DocumentStorage) {
  const sepa = await SepaDocument.findOne({
    where: {
      docId: storage.id,
    },
  });
  assert(sepa, `SepaDocument with docId:${storage.id} not found`);

  return {
    clientId: sepa.clientId,
  };
}

export default new Document({
  type: 'sepa',
  storageType: 'Delinternet-Documents-Sepa',
  initTitle: 'SEPA',
  signatures: ['default'],
  loadDetail,
  Storage: DelinternetStorage,
  Renderer: SepaRenderer,
});
