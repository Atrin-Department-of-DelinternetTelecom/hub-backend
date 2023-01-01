import { TechnicianTask } from '@models/technician/technician_tasks';
import { Task } from '@service/technician/Task';
import { ClientTask } from './client_task';
import { Assistance } from './Incidence/assistance';
import { RadioInstallation } from './installation/internet/radio';
import { FiberInstallation } from './installation/internet/fiber';
import { SimDelivery } from './Incidence/sim_delivery';

interface TaskFactory {
  type: string;
  loadFromTypeId: (id: number, technicianUserId: number) => Promise<Task>;
  loadFromTask: (task: TechnicianTask) => Promise<Task>;
}

export const TaskFactories = [
  FiberInstallation,
  RadioInstallation,
  Assistance,
  ClientTask,
  SimDelivery,
] satisfies TaskFactory[]; // DO NOT remove the satisfies syntax. **IT'S NECESSARY HERE.** just remove your old node_modules directory to get newer TypeScript version.

export type TaskTypes = (typeof TaskFactories)[number]['type'];
