import { format } from '@api/service/documents/utils';
import { InstallationReport as ReportEntity } from '@models/technician/installation_reports';
import { InstallationReportAdditionalWork } from '@models/technician/installation_report_addidtional_works';
import { InstallationReportMaterial } from '@models/technician/installation_report_materials';
import { TechnicianAdditionalWork } from '@models/technician/technician_additional_works';
import { TechnicianMaterial } from '@models/technician/technician_materials';
import { TechnicianTask } from '@models/technician/technician_tasks';
import assert from 'assert';
import { Fragment, h } from 'nano-jsx';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { App } from '../components/App';
import { DelinternetInfo, Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Close, Tick } from '../components/Icons';
import { Section } from '../components/Section';
import { Signature, SignatureContainer } from '../components/Signature';
import { Table, Td, Th, Tr } from '../components/Table';
import { AvoidPageBreak, BorderedText } from '../components/Typography';
import { Document } from '../document';
import { DelinternetStorage } from '../storages/DelinternetStorage';

const GeneralData = ({ k, v }: { k: string; v: string }) => (
  <div class="d-flex flex-column mb-1 w-50">
    <label class="text-gray uppercase">{k}</label>
    <p>{v}</p>
  </div>
);

class InstallationReportRenderer extends JsxRenderer {
  signs!: {
    client: Buffer | null;
    technician: Buffer | null;
  };
  entity!: ReportEntity;

  async loadProps() {
    const entity = await ReportEntity.findOne({
      where: {
        docId: `del:${this.storage.id}`,
      },
      include: [
        {
          model: TechnicianTask,
          as: 'task',
        },
        {
          model: InstallationReportMaterial,
          as: 'materials',
          include: [{ model: TechnicianMaterial, as: 'material' }],
        },
        {
          model: InstallationReportAdditionalWork,
          as: 'additionalWorks',
          include: [{ model: TechnicianAdditionalWork, as: 'additionalWork' }],
        },
      ],
    });
    assert(
      entity,
      `InstallationReport with docId:${this.storage.id} not found`,
    );

    this.entity = entity;
    this.signs = await this.loadSignatures();
  }

  // TODO(erfan): this can be refactored using getAllSignatures
  async loadSignatures() {
    return {
      client: await this.storage.getSignature('client'),
      technician: await this.storage.getSignature('technician'),
    };
  }

  getTitle() {
    return this.entity.isAssistance
      ? `Assistance Report`
      : `Installation Report`;
  }

  checkBaseDataIsComplete(): true {
    return true;
  }

  getPdfName() {
    return this.entity.isAssistance
      ? `Assistance Report`
      : `Installation Report`;
  }

  render() {
    const {
      entity: { isAssistance },
    } = this;

    const title = isAssistance ? 'Assistència' : 'Instal·lació';

    return (
      <App>
        <Section>
          <Header title={title} />
          <this.Content />
          <Footer>
            <SignatureContainer>
              <Signature
                label="DEL-INTERNET TELECOM S.L.U (Delinternet)"
                signature={this.signs.technician ?? null}
              />
              <Signature
                label="Signatura de l'usuari"
                signature={this.signs.client ?? null}
                date={this.storage.signatureUploadedDate}
              />
            </SignatureContainer>
            <DelinternetInfo />
          </Footer>
        </Section>
      </App>
    );
  }

  private Content = () => {
    const {
      entity: {
        createdAt,
        technicianName,
        clientName,
        address,
        city,
        clientPhone,
        clientEmail,
        clientObservation,
        technicianObservation,
        description,
        elapsedTime,
        task,
      },
    } = this;

    return (
      <div class="d-flex flex-column px-2">
        <div class="d-flex flex-wrap pt-2">
          <GeneralData k="Data" v={format(createdAt)} />
          <GeneralData k="Client" v={clientName} />
          <GeneralData k="Operari" v={technicianName} />
          <GeneralData k="Adreça" v={address} />
          <GeneralData k="Població" v={city} />
          <GeneralData k="Hora programata" v={format(task?.scheduledDate)} />
          <GeneralData k="Telèfon de contacte" v={clientPhone} />
          <GeneralData k="Temps emprat" v={`${elapsedTime} minutes`} />
          <GeneralData k="Correu electronic" v={clientEmail} />
        </div>

        {this.entity.materials!.length > 0 ? (
          <AvoidPageBreak>
            <h4>Materials</h4>
            <this.MaterialsTable />
          </AvoidPageBreak>
        ) : null}

        {this.entity.additionalWorks!.length > 0 ? (
          <AvoidPageBreak>
            <h4>Obres</h4>
            <this.AdditionalWorksTable />
          </AvoidPageBreak>
        ) : null}

        <AvoidPageBreak>
          <this.Summary />
        </AvoidPageBreak>

        {technicianObservation ? (
          <AvoidPageBreak>
            <h4>Incidència</h4>
            <BorderedText>{description}</BorderedText>
          </AvoidPageBreak>
        ) : null}

        {clientObservation ? (
          <AvoidPageBreak>
            <h4>Observació del client</h4>
            <BorderedText>{clientObservation}</BorderedText>
          </AvoidPageBreak>
        ) : null}

        {technicianObservation ? (
          <AvoidPageBreak>
            <h4>Observació del tècnic</h4>
            <BorderedText>{technicianObservation}</BorderedText>
          </AvoidPageBreak>
        ) : null}
      </div>
    );
  };

  private MaterialsTable = () => {
    // if isAssistance=false, we should not show material prices
    const { isAssistance } = this.entity;

    return (
      <Table>
        {isAssistance ? (
          <colgroup>
            <col span="1" style="width: 70%" />
            <col span="1" style="width: 15%" />
            <col span="1" style="width: 15%" />
          </colgroup>
        ) : (
          <colgroup>
            <col span="1" style="width: 85%" />
            <col span="1" style="width: 15%" />
          </colgroup>
        )}
        <thead>
          <Tr>
            <Th>Material</Th>
            <Th>Un.</Th>
            {isAssistance ? <Th>Preu total</Th> : null}
          </Tr>
        </thead>
        <tbody>
          {this.entity.materials?.map((e) => (
            <Tr>
              <Td weight="normal">{e.material?.title}</Td>
              <Td weight="normal">
                {e.amount} {e.material?.unit ?? ''}
              </Td>
              {isAssistance ? (
                <Td weight="normal">€ {e.totalPrice ?? '0.00'}</Td>
              ) : null}
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  };

  private AdditionalWorksTable = () => (
    <Table>
      <colgroup>
        <col span="1" style="width: 85%" />
        <col span="1" style="width: 15%" />
      </colgroup>
      <thead>
        <Tr>
          <Th>Obra</Th>
          <Th>Un.</Th>
        </Tr>
      </thead>
      <tbody>
        {this.entity.additionalWorks?.map((e) => (
          <Tr>
            <Td weight="normal">{e.additionalWork?.title}</Td>
            <Td weight="normal">
              {e.amount} {e.additionalWork?.unit ?? ''}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );

  private Summary = () => (
    <div
      class="mt-1"
      style={{ 'margin-left': '50%', border: '1px solid #d7deef' }}
    >
      <p
        style={{
          padding: '0.7rem',
          fontWeight: 'bold',
          fontSize: 16,
        }}
      >
        Resum
      </p>
      <table style={{ width: '100%' }}>
        <colgroup>
          <col span="1" style="width: 50%" />
          <col span="1" style="width: 25%" />
          <col span="1" style="width: 25%" />
        </colgroup>
        <tbody>
          {this.entity.isAssistance ? (
            <>
              <tr>
                <Td weight="normal">Operatiu</Td>
                <Td />
                <Td weight="normal" align="right">
                  € {this.entity.operationalCost ?? '0.00'}
                </Td>
              </tr>
              <tr>
                <Td weight="normal">Del material</Td>
                <Td />
                <Td weight="normal" align="right">
                  € {this.entity.materialCost ?? '0.00'}
                </Td>
              </tr>
            </>
          ) : null}

          <tr>
            <Td weight="normal">Base imposable</Td>
            <Td />
            <Td weight="normal" align="right">
              € {this.entity.subTotalCost ?? '0.00'}{' '}
            </Td>
          </tr>
          <tr>
            <Td weight="normal">Impostos</Td>
            <Td weight="normal">+ I.V.A {this.entity.taxRate}٪</Td>
            <Td weight="normal" align="right">
              €{' '}
              {(
                Number(this.entity.totalCost) - Number(this.entity.subTotalCost)
              ).toFixed(2)}
            </Td>
          </tr>
          <tr>
            <Td>Total a pagar</Td>
            <Td />
            <Td align="right">€ {this.entity.totalCost ?? '0.00'} </Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default new Document({
  storageType: 'Delinternet-Documents-InstallationReport',
  type: 'installation_report',
  initTitle: 'Installation Report',
  signatures: ['client', 'technician'],
  Renderer: InstallationReportRenderer,
  Storage: DelinternetStorage,
});
