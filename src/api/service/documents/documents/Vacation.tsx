import { h } from 'nano-jsx';
import { getDelSignature } from '../assets';
import { App } from '../components/App';
import { DelinternetInfo, Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Section } from '../components/Section';
import { Signature, SignatureContainer } from '../components/Signature';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';

class VacationRenderer extends JsxRenderer {
  delSignature!: Buffer;

  name = 'Erfan Safari';
  dni = '2420887080';
  startDate = new Date();
  endDate = new Date();
  nDays = 5;

  async loadProps() {
    this.delSignature = await getDelSignature();
  }

  getPdfName() {
    return 'vacation';
  }

  render() {
    return (
      <App>
        <Section>
          <Header title="Formulari Vacancse" />
          <div class="d-flex flex-column px-2">
            <h2 class="pb-1">Formulari Vacancse</h2>
            <p class="bigger">
              Jo, {this.name} amb el DNI {this.dni} faig constar que del dia{' '}
              {this.startDate.toLocaleDateString()} fins el dia{' '}
              {this.endDate.toLocaleDateString()} realitzaré {this.nDays} dies
              de vacances amb les condicions pertinents i dins els plaços
              pertinents.
            </p>
          </div>
          <Footer>
            <SignatureContainer>
              <Signature
                label="DEL-INTERNET TELECOM S.L.U (Delinternet)"
                signature={this.delSignature}
              />
              <Signature label="Signatura de l'aplicant" signature={null} />
            </SignatureContainer>
            <DelinternetInfo />
          </Footer>
        </Section>
      </App>
    );
  }
}

export default new Document({
  storageType: 'Delinternet-Documents-Vacation',
  type: 'vacation',
  initTitle: 'Vacation',
  signatures: ['default'],
  Renderer: VacationRenderer,
  Storage: DelinternetStorage,
});
