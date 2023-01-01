'use strict';

import StatsInstallersService from '@service/stats/StatsTechnicianService';
import { createRoute } from '@api/utils/controller-factory';
import { errors } from '@api/http/http_errors';
import { system } from '@api/models';

const { User } = system;

export const getTechnicians = createRoute({
  handler: (req) => {
    return StatsInstallersService.getTechnicians(req.query);
  },
});

export const getTechnicianDeprecated = createRoute({
  handler: async (req) => {
    const includeSoftDeletes =
      req.swagger.params['include-soft-deletes'].value === 'true'
        ? true
        : false;
    return StatsInstallersService.getTechnicianDeprecated(
      req.query,
      includeSoftDeletes,
    );
  },
});

export const getTechniciansTotalsDeprecated = createRoute({
  handler: async (req) => {
    const id = req.swagger.params.id.value; //global user id
    const user = await User.findByPk(id);
    if (!user) throw new errors.NotFound(`user with id ${id} not found`);
    return StatsInstallersService.getTechniciansTotalsDeprecated(
      user.id,
      req.query,
    );
  },
});

export const getTechnician = createRoute({
  handler: async (req) => {
    const includeSoftDeletes =
      req.swagger.params['include-soft-deletes'].value === 'true'
        ? true
        : false;
    return StatsInstallersService.getTechnician(req.query, includeSoftDeletes);
  },
});

export const getScheduledTasks = createRoute({
  handler: async (req) => {
    const includeSoftDeletes =
      req.swagger.params['include-soft-deletes'].value === 'true'
        ? true
        : false;
    return StatsInstallersService.getScheduledTasks(
      req.query,
      includeSoftDeletes,
    );
  },
});

export const getTechniciansTotals = createRoute({
  handler: async (req) => {
    const id = req.swagger.params.id.value; //global user id
    const user = await User.findByPk(id);
    if (!user) throw new errors.NotFound(`user with id ${id} not found`);
    return StatsInstallersService.getTechniciansTotals(user.id, req.query);
  },
});

export const getAllTechniciansTotals = createRoute({
  handler: async (req) => {
    return StatsInstallersService.getAllTechniciansTotals(req.query);
  },
});
