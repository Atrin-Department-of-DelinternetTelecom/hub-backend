import * as telegraf from '@lib/telegraf';

import { AnyModel, intranet } from '@models';
import {
  CancelledBy,
  TechnicianTask,
} from '@models/technician/technician_tasks';
import { Step, StepValidationError } from './Step';
import {
  createFullEvent,
  getTaskByTrace,
} from '../intranet/CrmTaskHelperService';

import { Address } from './utils/address';
import { DateTime } from 'luxon';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { SatisfactionForm } from '@api/models/global/global_satisfaction_form';
import { TechnicianCancelReason } from '@api/models/technician/technician_cancel_reasons';
import { TechnicianCoordinate } from '@api/models/technician/technician_coordinates';
import { TechnicianStep } from '@models/technician/technician_steps';
import { User } from '@models/global/global_users';
import assert from 'assert';
import { get as config } from '@config';
import { getAssistanceTrace } from '../intranet/GfAssistService';
import { getClientPhone } from '../unpaid/UnpaidInvoiceService';
import { getTechnology } from '../intranet/GfContractInternetService';
import moment from 'moment';
import parseTaskHtml from '../../models/intranet/utils/parseTaskHtml';
import { phoneNumberFormatter } from '@api/utils/phone-number-formatter';
import { sendSingle } from '@api/utils/smspubli';

const { GfAssist, GfContractDataInternet, InvoiceClient } = intranet;

export interface Coordinate {
  lat: number;
  lng: number;
}
export abstract class Task {
  abstract stepsInfo: readonly Step[];
  abstract address: Address;
  abstract expectedDurationMinutes: number;

  client: GfClient;
  contract?: AnyModel;
  entity: TechnicianTask;
  get id() {
    return this.entity.id;
  }

  static async findOrCreate({
    type,
    typeId,
    defaults,
  }: {
    type: string;
    typeId: number;
    defaults: () => Promise<{
      scheduledDate: Date;
      technicianUserId: number;
      gfClientId: number;
      gfContractId: number | null;
    }>;
  }) {
    return (
      (await Task.find({
        type,
        typeId,
      })) ??
      TechnicianTask.create({
        type,
        typeId,
        state: 'pending',
        ...(await defaults()),
      })
    );
  }

  static find(where: any) {
    return TechnicianTask.findOne({
      where: {
        state: ['pending', 'in_progress'],
        ...where,
      },
      include: [
        {
          model: TechnicianStep,
          as: 'steps',
        },
      ],
    });
  }

  constructor({
    entity,
    client,
    contract,
  }: {
    entity: TechnicianTask;
    client: AnyModel;
    contract?: AnyModel;
  }) {
    assert(client.documentType, 'Client documentType not included');
    if (contract) {
      assert(contract.fee_group, 'Contract FeeGroup not included');
    }
    this.entity = entity;
    this.client = client;
    this.contract = contract;
  }

  async setInProgressStep(stepName: string) {
    if (this.entity.state !== 'in_progress') {
      throw new Error('Task state is not in_progress');
    }

    const steps = this.entity.getSteps();
    const step = steps.find((step) => step.name === stepName);
    if (!step) return;

    // reset all in-progress steps
    steps
      .filter((s) => s.state === 'in_progress')
      .forEach((s) => s.set('state', 'pending'));

    step.set('state', 'in_progress');

    await Promise.all(steps.map((s) => s.save()));
  }

  async setStepAsDone(
    name: string,
    user: User,
    coordinate?: Coordinate,
    media?: string[],
  ) {
    if (this.entity.state !== 'in_progress') {
      throw new Error('Task state is not in_progress');
    }

    const step = this.stepsInfo.find((step) => step.name === name);
    if (!step) throw new Error(`Step name: ${name} not found`);

    const stepState = this.entity.getSteps().find((step) => step.name === name);
    if (!stepState) return;

    const result = await step.check();

    if (result === true) {
      await stepState.update({
        state: 'done',
        error: null,
        media: media ?? stepState.media ?? [],
      });

      if (this.isValidCoordinate(coordinate)) {
        await TechnicianCoordinate.create({
          technicianStepId: stepState.id,
          technicianTaskId: this.entity.id,
          state: this.entity.state,
          ...coordinate,
        });
      }

      const allStepsDone = this.entity
        .getSteps()
        .every((s) => s.state === 'done');

      if (allStepsDone) {
        await this.finish(user);
      }
    } else {
      await stepState.update({
        error: result,
      });
      throw new StepValidationError(name, result);
    }
  }

  async start(coordinates?: Coordinate): Promise<void> {
    if (this.entity.state !== 'pending') {
      throw new Error('only a pending task can be started');
    }

    await TechnicianStep.bulkCreate(
      this.stepsInfo.map((s, index) => ({
        taskId: this.entity.id,
        name: s.name,
        index,
      })),
    );

    await this.entity.reload({
      include: [
        {
          model: TechnicianStep,
          as: 'steps',
        },
      ],
    });

    await this.entity.update({
      state: 'in_progress',
      startedAt: new Date(),
      autoCloseAt: DateTime.now().plus({ hours: 2 }).toJSDate(),
    });

    if (this.isValidCoordinate(coordinates)) {
      await TechnicianCoordinate.create({
        technicianTaskId: this.entity.id,
        state: this.entity.state,
        ...coordinates,
      });
    }
  }

  protected isValidCoordinate(
    coordinates?: Coordinate,
  ): coordinates is Coordinate {
    if (!coordinates) return false;

    const lat = Number(coordinates.lat);
    const lng = Number(coordinates.lng);

    return !isNaN(lat) && !isNaN(lng);
  }

  async assertAllStepsToBeDone(): Promise<void> {
    const allOk = this.entity.getSteps().every((s) => s.state === 'done');
    if (!allOk) throw new Error('Task has pending steps');
  }

  async #sendFinishTelegramMessage() {
    const token = config('global.crmTaskBotToken', null);
    const channelId = config('global.crmTaskChannelId', null);

    if (!token || !channelId) {
      console.warn(
        'crm task telegram bot disabled due no global.crmTaskBotToken or global.crmTaskChannelId config',
      );
    } else {
      const validTaskTypes: string[] = [
        'installation/fibra',
        'installation/radio',
      ];
      const taskType = this.entity.type;
      if (validTaskTypes.includes(taskType)) {
        const bot = telegraf.getInstance(token);
        bot.telegram.sendMessage(
          channelId,
          await parseTaskHtml.generateTelegramMessageBasedOnTaskInstallation(
            this,
          ),
          { parse_mode: 'HTML' },
        );
      }
    }
  }

  async #sendCancelTelegramMessage({
    reasonId,
    description,
  }: {
    reasonId?: number;
    description?: string;
  }) {
    if (!reasonId) return;
    const reason = await TechnicianCancelReason.findByPk(reasonId);
    if (!reason) return;

    const token = config('global.crmTaskBotToken', null);
    const crmChannelId = config('global.crmTaskChannelId', null);
    const technicianChannelId = config('global.technicianChannelId', null);
    const technicianChannelThreadId = config(
      'global.technicianChannelThreadId',
      null,
    );
    if (
      !token ||
      !crmChannelId ||
      !technicianChannelId ||
      !technicianChannelThreadId
    ) {
      console.warn(
        'crm task telegram bot disabled due no global.crmTaskBotToken or global.crmTaskChannelId config or global.technicianChannelId config',
      );
    } else {
      const bot = telegraf.getInstance(token);
      const message =
        await parseTaskHtml.generateTelegramMessageBasedOnTaskCancellation(
          this,
          reason,
        );
      bot.telegram.sendMessage(technicianChannelId, message, {
        parse_mode: 'HTML',
        message_thread_id: technicianChannelThreadId,
      });
      bot.telegram.sendMessage(crmChannelId, message, { parse_mode: 'HTML' });
    }
  }

  async #sendSms() {
    const [phone, satisfactionForm] = await Promise.all([
      getClientPhone(this.client.id),
      this.#makeSatisfactionForm(),
    ]);

    const to = phoneNumberFormatter(phone);

    if (to) {
      const formUrl = this.#makeSatisfactionFormUrl(satisfactionForm);
      const result = await this.#sendSatisfactionForm(to, formUrl);

      if (result?.status === 'ok') {
        await satisfactionForm.setMessageReport(result.sms_id);
      }
    } else {
      console.warn(
        `Client ${this.client.id} has no phone number to send the satisfaction form`,
      );
    }
  }

  async #makeSatisfactionForm(): Promise<SatisfactionForm> {
    return SatisfactionForm.create({
      gf_client_id: this.client.id,
      gf_contract_id: this.contract?.id,
      technician_task_id: this.entity.id,
      sentAt: moment().toISOString(),
    });
  }

  #makeSatisfactionFormUrl({ form_id }: SatisfactionForm) {
    const pattern = config<string>('intranet.satisfaction_form');

    return pattern.replace('ID', form_id);
  }

  async #sendSatisfactionForm(to: string, url: string) {
    return sendSingle({
      to,
      text: `Benvingut/da a Delinternet! ens importa la teva opinió. Omple el formulari a ${url}. Gaudeix de la connexió d'alta velocitat!`,
    });
  }

  async finish(_user: User, coordinates?: Coordinate): Promise<void> {
    console.debug('coordinates', coordinates);
    const { state } = this.entity;
    if (state !== 'in_progress') {
      throw new Error('invalid task state');
    }

    await this.entity.update({
      state: 'done',
      finishedAt: new Date(),
      autoCloseAt: null,
    });

    if (this.isValidCoordinate(coordinates)) {
      await TechnicianCoordinate.create({
        technicianTaskId: this.entity.id,
        state: this.entity.state,
        ...coordinates,
      });
    }

    this.#sendFinishTelegramMessage().catch((e) => {
      console.error('[Task][sendTelegramMessage]', e);
    });

    if (!(await this.excludedFromMailing())) {
      this.#sendSms().catch((e) => console.error('[Task][sendSms]', e));
    } else {
      console.warn(
        `The client with ID ${this.client.id} excluded from mailing!`,
      );
    }
  }

  async excludedFromMailing() {
    const invoiceClient = await InvoiceClient.findByPk(
      this.client.invoiceClientId,
    );

    return Boolean(invoiceClient?.excludeFromMailings);
  }

  async cancel(
    {
      by,
      reasonId,
      description,
      cancelledAt,
      coordinates,
    }: {
      by: CancelledBy;
      reasonId?: number;
      description?: string;
      cancelledAt?: Date;
      coordinates?: Coordinate;
    },
    {
      intranetUserId,
      globalUserId,
    }: { intranetUserId: number; globalUserId: number },
  ): Promise<void> {
    const oldState = this.entity.state;
    await this.entity.update({
      state: 'cancelled',
      cancelledBy: by,
      cancelledAt: cancelledAt ?? new Date(),
      cancelReasonId: reasonId,
      cancelReasonDescription: description,
      cancelledById: globalUserId,
    });
    if (this.isValidCoordinate(coordinates)) {
      await TechnicianCoordinate.create({
        technicianTaskId: this.entity.id,
        state: this.entity.state,
        ...coordinates,
      });
    }
    await this.cancellationCrmTask(description, intranetUserId);
    if (oldState === 'in_progress' && by === 'technician') {
      this.#sendCancelTelegramMessage({ reasonId, description });
    }
  }

  private async cancellationCrmTask(
    description: string | undefined,
    userId: number,
  ) {
    assert(this.contract);
    await createFullEvent(
      'cancel_technician_task',
      this.contract.id,
      {
        subject: 'cancel installation task',
        text: `<b>${description ?? 'task is cancelled'} </b><br><br>`,
        metadata: {},
        ...(await this.getCrmTaskDetail()),
      },
      null,
      null,
      userId,
    );
  }

  private async getCrmTaskDetail() {
    const type = this.entity.type;
    let chatId: string | undefined = undefined;
    switch (type) {
      case 'incidence/assistance': {
        const assist = await GfAssist.findByPk(this.entity.typeId);
        assert(assist, 'assist not found');
        const key = await getAssistanceTrace(assist);
        const task = await getTaskByTrace(key);
        chatId = task?.chatId;
        break;
      }

      case 'installation/fibra':
      case 'installation/radio': {
        const dataInternet = await GfContractDataInternet.findByPk(
          this.entity.typeId,
        );
        assert(dataInternet, 'dataInternet not found');

        const technology = await getTechnology(dataInternet.contractId);
        const task = await getTaskByTrace(
          `installation/${technology}_${dataInternet.contractId}_INTERNET`,
        );
        chatId = task?.chatId;
        break;
      }
    }
    return { chatId };
  }
}
