import { TechnicianTask } from '@models/technician/technician_tasks';
import { Step } from '@service/technician/Step';
import {
  InternetInstallation,
  loadFromTask,
  loadFromTypeId,
} from '../internet';

export class RadioInstallation extends InternetInstallation {
  static type = 'installation/radio' as const;
  static loadFromTask = (task: TechnicianTask) =>
    loadFromTask(RadioInstallation, task);

  static loadFromTypeId = (id: number) => loadFromTypeId(RadioInstallation, id);

  stepsInfo: readonly Step[] = [
    new Step('reaching-to-the-destination'),
    new Step('upload-client-documents', {
      check: () => this.checkDocsToBeSigned(),
    }),
    new Step('upload-post-installation-images'),
    new Step('generate-the-installation-report', {
      check: () => this.checkReportToBeGenerated(),
    }),
    new Step('sign-the-installation-report', {
      check: () => this.checkReportToBeSigned(),
    }),
    new Step('connect-the-router', {
      check: () => this.checkFirstConnection(),
    }),
  ];
}
