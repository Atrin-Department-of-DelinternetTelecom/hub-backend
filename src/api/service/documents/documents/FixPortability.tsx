import { Close, Tick } from '../components/Icons';
import { DelinternetInfo, Footer } from '../components/Footer';
import { Fragment, h } from 'nano-jsx';
import { GfDocStorage, assertGfStorage } from '../storages/GfDocStorage';
import { Signature, SignatureContainer } from '../components/Signature';
import { getAireSignature, getDelSignature } from '../assets';

import { App } from '../components/App';
import { AvoidPageBreak } from '../components/Typography';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import GeoGoufoneService from '@service/intranet/GeoGoufoneService';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { Header } from '../components/Header';
import { JsxRenderer } from '../renderers/JsxRenderer';
import { Section } from '../components/Section';
import _ from 'lodash';
import assert from 'assert';
import { intranet } from '@models';
import operadorFixFacadeInstance from '@api/service/intranet/OperadorFixFacade';

const { GfContract, GfContractDataFix, GfFeeGroup, GfSection, GfFee } =
  intranet;

class FixPortabilityRenderer extends JsxRenderer {
  clientAddressLine1!: string;
  dataFix!: {
    number: string;
    extension: string;
    portability: 0 | 1;
  };
  fee!: {
    name: string;
    description: string;
  };
  operadorsData:
    | {
        access_type_code: '01' | '03' | '04';
        operator_name: string;
      }
    | undefined;
  client!: GfClient;
  sign!: Buffer | null;
  delSignature!: Buffer | null;
  aireSignature!: Buffer | null;

  async loadProps(): Promise<void> {
    assertGfStorage(this.storage);
    const { clientId, contractId } = this.storage.gfDoc;

    const client = await GfClient.findByPk(clientId);
    assert(client, `Client with id:${clientId} not found`);
    this.client = client;

    assert(contractId);
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
        },
      ],
    });
    assert(contract, `Contract with id:${contractId} not found`);

    this.fee = contract.fee_group;
    this.dataFix = contract.dataFix;

    const clientAddress = GeoGoufoneService.getFormatedAddress(client, true);

    this.clientAddressLine1 = clientAddress.line1;

    this.sign = await this.storage.getSignature('default');
    this.delSignature = await getDelSignature();
    const result = await operadorFixFacadeInstance.getInboundPortability({
      number: this.dataFix.extension,
    });
    if (result.success) {
      this.operadorsData = result.data as any;
    }
  }
  checkBaseDataIsComplete(): true {
    return true;
  }

  getTitle() {
    return `Fix portabilitat (${this.fee.name})`;
  }

  getPdfName() {
    return _.kebabCase(this.storage.title);
  }

  render() {
    return (
      <App>
        <Section>
          <Header title="Fix Portabilitat" />
          <this.ContractContent />
          <AvoidPageBreak>
            <this.Conditions />
          </AvoidPageBreak>
          <this.Footer />
        </Section>
      </App>
    );
  }

  private Footer = () => {
    return (
      <Footer>
        <SignatureContainer>
          <Signature
            label={"Signatura de l'usuari"}
            signature={this.sign}
            date={this.storage.signatureUploadedDate}
          />
          <Signature
            label={"Signatura de l'operador receptor"}
            signature={this.delSignature}
          />
        </SignatureContainer>
        <DelinternetInfo />
      </Footer>
    );
  };

  private ContractContent = () => {
    const { client } = this;

    return (
      <div class="d-flex flex-column px-2">
        <h6 class="my-1">DADES DEL CLIENT</h6>
        <div class="d-flex flex-wrap">
          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Nom del client</label>
            <span class="small">{client.name}</span>
          </div>
          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">NIF / CIF</label>
            <span class="small">{client.fiscalId}</span>
          </div>
          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Codi Postal</label>
            <span class="small">{client.addressPostalCodeCodeName}</span>
          </div>
          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Direcció</label>
            <span class="small">{this.clientAddressLine1}</span>
          </div>
          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Localitat</label>
            <span class="small">{client.addressCityCodeName}</span>
          </div>
          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Província</label>
            <span class="small">{client.addressProvinceCodeName}</span>
          </div>
          <div class="d-flex flex-column w-50">
            <label class="text-gray uppercase small">Telèfon</label>
            <span class="small">{client.contactPhone}</span>
          </div>
          <div class="d-flex flex-column w-50">
            <label class="text-gray uppercase small">E-mail</label>
            <span class="small">{client.emailAddress ?? '-'}</span>
          </div>
        </div>

        <hr class="my-1/2" />

        <h6 class="my-1">DADES DEL TITULAR DE LA LÍNIA TELEFÒNICA</h6>
        <div class="d-flex flex-wrap">
          <div class="d-flex flex-column mb-1/3 w-25">
            <label class="text-gray uppercase small">Nom del client</label>
            <span class="small">{client.name}</span>
          </div>

          <div class="d-flex flex-column mb-1/3 w-25">
            <label class="text-gray uppercase small">NIF / CIF</label>
            <span class="small">{client.fiscalId}</span>
          </div>

          <div class="d-flex flex-column mb-1/3 w-25">
            <label class="text-gray uppercase small">Persona apoderada</label>
            <span class="small">{client.name}</span>
          </div>

          <div class="d-flex flex-column mb-1/3 w-25">
            <label class="text-gray uppercase small">NIF / CIF</label>
            <span class="small">{client.fiscalId}</span>
          </div>

          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Direcció</label>
            <span class="small">{this.clientAddressLine1}</span>
          </div>

          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Població</label>
            <span class="small">{client.addressCityCodeName}</span>
          </div>

          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Codi Postal</label>
            <span class="small">{client.addressPostalCodeCodeName}</span>
          </div>

          <div class="d-flex flex-column mb-1/3 w-50">
            <label class="text-gray uppercase small">Província</label>
            <span class="small">{client.addressProvinceCodeName}</span>
          </div>

          <small class="text-gray smaller">
            <b>*</b>Només si són diferents de les dades del client
          </small>
        </div>

        <hr class="my-1/2" />

        <div class="d-flex">
          <div class="d-flex flex-wrap w-75">
            <div class="d-flex flex-column w-50">
              <h6 class="my-1">NUMERACIÓ A PORTAR</h6>

              <div class="d-flex flex-column">
                <label class="text-gray uppercase small">
                  Núm. telèfon des de
                </label>
                <span class="small">{this.dataFix.number}</span>
              </div>

              <div class="d-flex flex-column">
                <label class="text-gray uppercase small">Fins a</label>
                <span class="small">-</span>
              </div>
            </div>

            <div class="d-flex flex-column w-50">
              <h6 class="my-1">DADES DE L'OPERADOR</h6>

              <div class="d-flex flex-column">
                <label class="text-gray uppercase small">Operador donant</label>
                <span class="small">
                  {this.operadorsData?.operator_name ?? '-'}
                </span>
              </div>
            </div>

            <div class="d-flex flex-column">
              <h6 class="my-1">
                HORARI PREFERIT PEL CANVI
                <small class="text-gray lowercase smaller">
                  &nbsp;NOMÉS PER TELEFONIA FIXA, SOTA DISPONIBILITAT DE
                  L'OPERADOR DONANT
                </small>
              </h6>
              <div class="d-flex flex-wrap">
                <div class="d-flex flex-column mb-1/3 w-50">
                  <label class="text-gray uppercase small">Hora d'inici</label>
                  <span class="small">08:00</span>
                </div>
                <small class="text-gray smaller">
                  de dilluns de divendres de 9:00 hores a les 14:00 hores i de
                  17:00 hores a 19:00 hores
                </small>
              </div>
            </div>
          </div>
          <div class="d-flex flex-column w-25">
            <h6 class="my-1">TIPUS D'ACCES</h6>
            <div class="d-flex align-center mb-1/2">
              {this.operadorsData?.access_type_code === '01' ? (
                <Tick />
              ) : (
                <Close />
              )}
              <small class="text-gray uppercase px-1/2 smaller">
                Individual Analògic
              </small>
            </div>

            <div class="d-flex align-center mb-1/2">
              {this.operadorsData?.access_type_code === '03' ? (
                <Tick />
              ) : (
                <Close />
              )}
              <small class="text-gray uppercase px-1/2 smaller">
                Accés bàsic RDSI
              </small>
            </div>

            <div class="d-flex align-center mb-1/2">
              {this.operadorsData?.access_type_code === '04' ? (
                <Tick />
              ) : (
                <Close />
              )}
              <small class="text-gray uppercase px-1/2 smaller">
                Numeració xarxa intel·ligent
              </small>
            </div>
          </div>
        </div>

        <hr class="my-1/2" />

        <small class="text-gray tiny">
          Els comunico que desitjo donar-me de baixa en els serveis que
          actualment en tinc contractats amb Vos. (operador donant) corresponent
          als números de telèfon que es detallen en aquest escrit, i que desitjo
          conservar aquesta numeració raó per la qual igualment els sol·licito
          que al produir-se la baixa, els meus números de telèfons siguin
          portats al meu nou proveïdor del servei de telefonia (operador
          receptor). Accepto la possible interrupció o limitació en la prestació
          del servei durant el temps mínim indispensable per realitzar els
          treballs de canvi d'operador, que serà d'un màxim de 4 hores. He estat
          informat que la conservació dels números és una facilitat que afecta
          múltiples operadors, el funcionament dels quals és complex i la seva
          implantació no ha estat suficientment provada i per això deficiències
          en la seva prestació poden produir-se. El sotasignat, d'acord amb el
          que disposa la normativa vigent, autoritza la transferència, als
          operadors involucrats en el procés de conservació de la numeració, de
          les dades personals que siguin necessàries per poder dur a terme
          ambdós processos. La negativa o revocació d'aquesta autorització
          impedirà dur a terme la desagregació del bucle i/o la portabilitat
          sol·licitada dels números amunt indicats. Podré exercitar els meus
          drets d'accés, rectificació, cancel·lació i oposició sobre les dades
          tractades per l'operador receptor: Oficina d'Atenció al Client.
        </small>
      </div>
    );
  };

  private Conditions = () => {
    return (
      <div class="d-flex flex-column px-2">
        <div lang="en" class="smaller text-black-90">
          <h5 class="mb-1/2 text-black uppercase">Condicions per al Client:</h5>
          <ol class="number-list">
            <li>
              Donar-se prèviament d'alta amb l'Operador, mitjançant la
              subscripció del corresponent contracte de prestació de serveis.
            </li>
            <li>
              Complimentar correctament la present sol·licitud per tramitar la
              baixa amb l'Operador Donant, que manifesti així mateix el seu
              desig de conservar la seva numeració amb un operador.
            </li>
            <li>
              No trobar-se en situació de suspensió o interrupció del servei amb
              l'Operador Donant per impagament.
            </li>
            <li>
              El Client accepta la possible interrupció o limitació en la
              prestació del servei durant el temps mínim indispensable per
              realitzar els treballs de canvi d'operador, que tindrà lloc en
              l'horari comercial de dilluns a divendres de 9:00 hores a 14:00
              hores i de 17:00 hores a 19:00 hores, amb una durada màxima de
              quatre hores, exceptuant els dies de festa nacional, festes de la
              Comunitat i festes locals, sense que això doni cap dret a
              qualsevol tipus d'indemnització.
            </li>
            <li>
              El client/abonat autoritza a l'Operador a portar tota la numeració
              associada als números de capçalera en cas que el client hagi
              identificat com a número a portar un número associat a un número
              de capçalera.
            </li>
          </ol>
          <h5 class="mb-1/2 text-black uppercase">
            Condicions per a l'Operador:
          </h5>
          <ol class="number-list">
            <li>
              Tramitar la conservació de la numeració sol·licitada pel client
              sempre que:
              <ul class="disk">
                <li>
                  El Client es doni d'alta amb l'Operador mitjançant el
                  corresponent contracte de prestació de serveis.
                </li>
                <li>
                  Simultàniament, sol·liciti a l'Operador que li tramiti la
                  baixa amb l'Operador Donant, conservant la numeració
                  (mitjançant la present sol·licitud).
                </li>
              </ul>
            </li>
            <li>
              Proporcionar la conservació de la numeració mentre hi hagi canvi
              d'operador de "xarxa telefònica pública fixa", però no hi hagi
              modificació del servei, ni d'ubicació física.
            </li>
            <li>
              L'Operador respondrà dels danys que li siguin causats al Client en
              el transcurs d'un procés de canvi d'operador correctament
              sol·licitat pel Client, tret que els danys:
              <ul class="disk">
                <li>
                  No siguin imputables a les accions o omissions de l'Operador.
                </li>
                <li>
                  Hagin estat causats pel propi Client o per tercers operadors.
                </li>
                <li>
                  Es produeixi a conseqüència de la possible interrupció o
                  limitació en la prestació del servei durant el temps mínim
                  indispensable per realitzar els treballs de canvi d'operador,
                  i/o quan es doni a conseqüència de les causes de força major o
                  cas fortuït.
                </li>
              </ul>
            </li>
            <li>
              Notificar al Client amb un mínim de 3 dies d'antelació quan serà
              efectiva la conservació de la numeració.
            </li>
          </ol>
          <h5 class="mb-1/2 text-black uppercase">
            Causes per les quals no es podrà dur a terme la conservació de la
            numeració:
          </h5>
          <p>
            L'Operador no serà responsable de la impossibilitat de proporcionar
            la conservació de la numeració en els següents casos:
          </p>
          <ol class="number-list">
            <li>Per canvi d'ubicació física del Client.</li>
            <li>
              Quan l'abonat del donant es trobi amb el servei suspès o
              interromput en els termes establerts en la legislació vigent.
            </li>
            <li>
              Per dades incompletes o errònies sobre la identificació del
              Client, de l’Operador Donant o de l'Operador Receptor en la
              present sol·licitud.
            </li>
            <li>
              Per la falta de correspondència entre la numeració i el Client
              identificat pel seu NIF/CIF.
            </li>
            <li>
              Perquè transcorregut un mes des que el Client fou baixa amb
              l'operador que en aqueix moment li proveïa el servei, no
              sol·licità la conservació del número amb l'Operador receptor.
            </li>
            <li>
              Per indicació de l'Entitat de Referència que ja existeix un procés
              de portabilitat d'aquesta numeració amb un altre operador.
            </li>
            <li>
              Per causes de força major o tècniques sempre que siguin
              justificades (tipus d'accés erroni, numeració associada a grups de
              salt).
            </li>
            <li>
              Qualsevol altra causa que pugui ser acordada voluntàriament entre
              els operadors dins del marc legal.
            </li>
            <li>
              Perquè el prefix associat al número que es portarà, que serveix
              les xarxes de domini d'encaminament de portabilitat per enrutar
              adequadament la xarxa receptora les trucades realitzades a aquest
              número portat, no estigui obert en interconnexió.
            </li>
          </ol>
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
  type: 'fix_portability',
  storageType: 'Goufone-Documents-FixPortabilidad',
  initTitle: 'Fix Portabilidad',
  signatures: ['default'],
  loadDetail,
  Storage: GfDocStorage,
  Renderer: FixPortabilityRenderer,
});
