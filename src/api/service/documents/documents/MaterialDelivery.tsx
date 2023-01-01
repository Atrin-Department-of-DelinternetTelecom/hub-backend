import { AnyModel, system } from '@models';
import assert from 'assert';
import fs from 'fs/promises';
import { Fragment, h } from 'nano-jsx';
import path from 'path';
import { App } from '../components/App';
import { DelinternetInfo, Footer } from '../components/Footer';
import { Header } from '../components/Header';
import Image from '../components/Image';
import { Section } from '../components/Section';
import { Signature, SignatureContainer } from '../components/Signature';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { getDelSignature } from '../assets';
import { Document } from '../document';
import { DelinternetStorage } from '../storages/DelinternetStorage';

const { Material, User } = system;

class MaterialDeliveryRenderer extends JsxRenderer {
  delSignature!: Buffer;
  material!: AnyModel;
  materialImage_1: {
    image: Buffer;
    extension: string;
  } | null = null;
  materialImage_2: {
    image: Buffer;
    extension: string;
  } | null = null;
  materialImage_3: {
    image: Buffer;
    extension: string;
  } | null = null;
  clientSign!: Buffer | null;
  extension!: string;

  async loadProps() {
    this.delSignature = await getDelSignature();
    this.clientSign = await this.storage.getSignature('default');
    const material = await Material.findOne({
      where: {
        doc_id: this.storage.id,
      },

      include: [
        {
          model: User,
          as: 'user',
          required: true,
        },
      ],
    });
    assert(
      material,
      `material with document id: ${this.storage.id} could not be found`,
    );
    this.material = material;

    if (material && material.image_1)
      this.materialImage_1 = {
        image: await fs.readFile(path.resolve(material.image_1)),
        extension: path.extname(material.image_1).substring(1),
      };
    if (material && material.image_2)
      this.materialImage_2 = {
        image: await fs.readFile(path.resolve(material.image_2)),
        extension: path.extname(material.image_2).substring(1),
      };
    if (material && material.image_3)
      this.materialImage_3 = {
        image: await fs.readFile(path.resolve(material.image_3)),
        extension: path.extname(material.image_3).substring(1),
      };
  }

  getTitle() {
    return `MaterialDelivery`;
  }

  checkBaseDataIsComplete(): true {
    return true;
  }

  getPdfName() {
    return `Material-${this.material.name}`;
  }

  render() {
    return (
      <App>
        <Section>
          <Header sideText="Entrega de material" />
          <this.Content />
          <Footer>
            <SignatureContainer>
              <Signature
                label="DEL-INTERNET TELECOM S.L.U (Delinternet)"
                signature={this.delSignature}
              />
              <Signature
                label="Signatura de l'aplicant"
                signature={this.clientSign}
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
    const { user = {}, name, description } = this.material;
    const { first_name, last_name, dni } = user;
    return (
      <>
        <div class="d-flex flex-column px-2">
          <h2 class="pb-1">FULL ENTREGA DE MATERIAL</h2>

          <p class="bigger">
            Jo, {`${first_name} ${last_name}`} amb DNI {dni} reconeixo amb les
            meves plenes facultats haver rebut el següent material de
            DEL-INTERNET TELECOM S.L.U. i per tant, em comprometo que el dia de
            finalització i no renovació/renúncia voluntària del meu contracte
            amb la societat*, a TORNAR TOTS ELS EQUIPS facilitats.
            <br /> En cas de no poder tornar aquest material, accepto les
            accions que haurà de prendre la societat per recuperar el material o
            l’import total d’aquest material
          </p>
          {/* <p class="bigger p-2">
            {first_name} {last_name} radial de ferreteria
          </p> */}
        </div>
        {/* {this.materialImages && this.materialImages.length
          ? this.materialImages.map((item) => (
              <Image
                extension={this.materialImage?.extension}
                file={this.materialImage?.image}
              />
            ))
          : null} */}
        <div class="material-images-container">
          <div class="extra-info-container d-flex">
            {this.materialImage_1 ? (
              <Image
                extension={this.materialImage_1?.extension}
                file={this.materialImage_1?.image}
              />
            ) : null}
            {this.materialImage_2 ? (
              <Image
                extension={this.materialImage_2?.extension}
                file={this.materialImage_2?.image}
              />
            ) : null}
            {this.materialImage_3 ? (
              <Image
                extension={this.materialImage_3?.extension}
                file={this.materialImage_3?.image}
              />
            ) : null}
          </div>
          {description ? <p class="bigger">{description}</p> : null}
        </div>
      </>
    );
  };
}

export default new Document({
  storageType: 'Delinternet-Documents-MaterialDelivery',
  type: 'material_delivery',
  initTitle: 'Material Delivery',
  signatures: ['default'],
  Renderer: MaterialDeliveryRenderer,
  Storage: DelinternetStorage,
});
