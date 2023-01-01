import * as InstallationReport from '@service/technician/InstallationReport';
import { createRoute } from '@utils/controller-factory';

export const getInstallationReports = createRoute({
  handler(req) {
    return InstallationReport.getReports(req.query);
  },
});

export const createInstallationReport = createRoute({
  async handler(req) {
    return InstallationReport.createReport(req.body);
  },
});

export const putInstallationReport = createRoute({
  async handler(req) {
    return InstallationReport.editReport(req.body);
  },
});

export const calculateReportDetail = createRoute({
  async handler(req) {
    return InstallationReport.calculateReportDetail(req.body);
  },
});

export const setReportReviewStatus = createRoute({
  async handler(req) {
    const { swagger } = req;
    const id = swagger.params.id.value;
    const body = swagger.params.body.value;
    return InstallationReport.setReportReviewStatus(
      id,
      {
        reviewStatus: body.reviewStatus,
        discountAmount: body.discount ?? 0,
        chargeAmount: body.charge,
        operatorDescription: body.operatorDescription,
      },
      {
        globalUserId: req.user.id,
        intranetUserId: req.user.userId,
      },
    );
  },
});

export const getReportByTaskId = createRoute({
  async handler(req) {
    const { swagger } = req;
    const taskId = swagger.params.id.value;

    return InstallationReport.getReportByTaskId(taskId);
  },
});

export const getReportById = createRoute({
  async handler(req) {
    const { swagger } = req;
    const id = swagger.params.id.value;
    return InstallationReport.getReportById(id);
  },
});

export const getMaterials = createRoute({
  handler(req) {
    const { query } = req;
    return InstallationReport.getMaterials(query);
  },
});

export const getAdditionalWorks = createRoute({
  handler(req) {
    const { query } = req;
    return InstallationReport.getAdditionalWorks(query);
  },
});
