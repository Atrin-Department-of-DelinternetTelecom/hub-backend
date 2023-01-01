import { AnyModel, system } from '@models';
import assert from 'assert';
import { h } from 'nano-jsx';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { App } from '../components/App';
import { DelinternetInfo, Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Section } from '../components/Section';
import { Signature, SignatureContainer } from '../components/Signature';
import { getDelSignature } from '../assets';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';

const { LeaveRequest: LeaveRequestModal, User } = system;

class LeaveRequestRenderer extends JsxRenderer {
  delSignature!: Buffer;
  leaveRequest!: AnyModel;
  clientSign!: Buffer | null;
  extension!: string;

  async loadProps() {
    this.delSignature = await getDelSignature();
    this.clientSign = await this.storage.getSignature('default');
    const leaveRequest = await LeaveRequestModal.findOne({
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
      leaveRequest,
      `leaveRequest with id ${this.storage.id} could not be found`,
    );
    this.leaveRequest = leaveRequest;
  }

  getTitle() {
    return `LeaveRequest`;
  }

  checkBaseDataIsComplete(): true {
    return true;
  }

  getPdfName() {
    return 'Leave-Request';
  }

  render() {
    return (
      <App>
        <Section>
          <Header sideText="Entrega de Leave Request" />
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
    const {
      user = {},
      start_date,
      end_date,
      description,
      vacations = 0,
    } = this.leaveRequest;
    const { first_name, last_name, dni } = user;

    return (
      <div class="d-flex flex-column px-2">
        <h2 class="pb-4">FORMULARI VACANCES</h2>
        <p class="bigger">
          Jo, {first_name} {last_name} amb el DNI {dni} faig constar que del dia{' '}
          {start_date.toLocaleString().split(',')[0]} fins el dia{' '}
          {end_date.toLocaleString().split(',')[0]} realitzare {vacations} dies
          de vacances amb les condicions pertinents i dins els placos
          pertinents.
        </p>
        <h2>Observacions:</h2>
        {description ? <p class="bigger">{description}</p> : null}
      </div>
    );
  };
}

export default new Document({
  storageType: 'Delinternet-Documents-LeaveRequest',
  type: 'leave_request',
  initTitle: 'Leave Request',
  signatures: ['default'],
  Renderer: LeaveRequestRenderer,
  Storage: DelinternetStorage,
});
