import { DelinternetInfo, Footer } from '../components/Footer';
import { Fragment, h } from 'nano-jsx';
import { Signature, SignatureContainer } from '../components/Signature';

import { App } from '../components/App';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfDocStorage } from '../storages/GfDocStorage';
import { GrantPermission as GrantPermissionModel } from '@models/hrms/hrms_grant_permission';
import { GrantablePermission } from '@api/models/hrms/hrms_grantable_permission';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Section } from '../components/Section';
import assert from 'assert';
import { getDelSignature } from '../assets';

class GrantPermissionRenderer extends JsxRenderer {
  signs!: {
    client: Buffer | null;
    authorized: Buffer | null;
    delSignature: Buffer | null;
  };
  entity!: GrantPermissionModel;

  async loadProps() {
    const entity = await GrantPermissionModel.findOne({
      where: {
        docId: this.storage.id,
      },
      include: [
        {
          model: GfClient,
          as: 'client',
        },
        {
          model: GrantablePermission,
          as: 'permissions',
          required: false,
        },
      ],
    });
    assert(entity, `GrantPermission with docId:${this.storage.id} not found`);

    this.entity = entity;
    this.signs = await this.loadSignatures();
  }

  // TODO(erfan): this can be refactored using getAllSignatures
  async loadSignatures() {
    return {
      client: await this.storage.getSignature('client'),
      authorized: await this.storage.getSignature('authorized'),
      delSignature: await getDelSignature(),
    };
  }

  getTitle() {
    return `Grant Permission`;
  }

  getPdfName() {
    return `Grant Permission Document`;
  }

  render() {
    return (
      <App>
        <Section>
          <Header title="informació personal" />
          <this.Content />
          <Footer>
            <SignatureContainer>
              <Signature
                label="Client principal"
                signature={this.signs.client ?? null}
              />
              <Signature
                label="Agent"
                signature={this.signs.authorized ?? null}
                date={this.storage.signatureUploadedDate}
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

  private Content = () => {
    const { entity } = this;

    return (
      <div class="d-flex flex-column px-2">
        <h1>Formulari de cessió d’informació personal i confidencial</h1>
        <h2>Preguntat per</h2>
        <div class="d-flex flex-wrap pt-2">
          <GeneralData k="Nom del client" v={entity.client.name} />
          <GeneralData k="DNI client" v={entity.client.fiscalId} />
        </div>

        <p>
          Dono el meu permís a Delinternet Telecom SLU per a que pugui cedir les
          meves dades confidencials a:
        </p>
        <h2>Aprovat per</h2>
        <div class="d-flex flex-wrap pt-2">
          <GeneralData k="Nom adjunt" v={entity.authorizedName} />
          <GeneralData k="DNI adjunt" v={entity.authorizedFiscalId} />
        </div>

        <h2>Permisos</h2>
        <ul
          class="mb-2"
          style={{ 'padding-left': '2rem', 'list-style': 'disc' }}
        >
          {entity.permissions!.map((permission) => (
            <li>{permission.name}</li>
          ))}
          {entity.description && <li>{entity.description}</li>}
        </ul>

        <p class="pt-2">
          Em comprometo a no demanar explicacions a Delinternet Telecom en cas
          de que aquesta informació sigui filtrada i/o mal utilitzada per
          qualsevol altre tipus de canal que no sigui el de l’empresa.
        </p>
      </div>
    );
  };
}

const GeneralData = ({ k, v }: { k: string; v: string }) => (
  <div class="d-flex flex-column mb-1 w-50">
    <label class="text-gray uppercase">{k}</label>
    <p>{v}</p>
  </div>
);

async function loadDetail(storage: DocumentStorage) {
  const entity = await GrantPermissionModel.findOne({
    where: {
      docId: storage.id,
    },
  });
  assert(entity);

  return {
    grantPermissionId: entity.id,
    clientId: entity.clientId,
    authorizedName: entity.authorizedName,
    authorizedFiscalId: entity.authorizedFiscalId,
  };
}

export default new Document({
  storageType: 'Delinternet-Documents-GrantPermission',
  type: 'grant_permission',
  initTitle: 'Grant Permission',
  signatures: ['client', 'authorized'],
  loadDetail,
  Storage: GfDocStorage,
  Renderer: GrantPermissionRenderer,
});
