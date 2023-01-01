'use strict';

/**
 * This is helper mysql view to make relation between gf_fee_groups and gf_fees table 1:1.
 * also used by club-backend project
 * DO NOT remove it unless you are sure
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW technician_tasks_view AS
SELECT
  'incidence/assistance' AS type,
  ga.id AS typeId,
  ga.contractId,
  ga.clientId,
  IFNULL(tt.technician_user_id, gu.id) AS userId,
  IFNULL(ga.duration, 60) AS duration,
  ga.previsionDate AS duoDate,
  ga.closed AS isDone,
  tt.id AS technicianTaskId,
  tt.id AS technician_id,
  tt.state AS technician_state,
  tt.started_at AS technician_started_at,
  tt.cancelled_by AS technician_cancelled_by,
  tt.cancel_reason_description AS technician_cancel_reason_description,
  tcr.label AS technician_cancel_reason_label,
  tcr.id AS technician_cancel_reason_id,
  tt.deleted_at AS technician_deleted_at,
  tt.cancelled_at AS technician_cancelled_at,
  tt.cancelled_by_id AS cancelledById,
  tt.finished_at AS finishedAt,
  tt.auto_close_at AS autoCloseAt,
  c.reference
FROM gf_assists ga
INNER JOIN delinternet_hub.global_users gu
  ON gu.gf_user_id = ga.gfUserId
LEFT JOIN gf_contracts c
  ON c.id = ga.contractId
LEFT JOIN delinternet_hub.technician_tasks tt
  ON tt.type_id = ga.id AND tt.type = 'incidence/assistance'
LEFT JOIN delinternet_hub.technician_cancel_reasons tcr
  ON tt.cancel_reason_id = tcr.id
WHERE ga.status = 1
  AND c.status = 1
  AND c.id IS NOT NULL
  AND NOT (tt.state = 'cancelled' AND ga.closed = TRUE)

UNION ALL

SELECT
  IF(affv.internetTechnology = 'fibra', 'installation/fibra', 'installation/radio') AS type,
  gdi.id AS typeId,
  gdi.contractId,
  c.clientId,
  IFNULL(tt.technician_user_id, gu.id) AS userId,
  120 AS duration,
  gdi.instalationDate AS duoDate,
  IFNULL(gdi.installationDone, 0) AS isDone,
  tt.id AS technicianTaskId,
  tt.id AS technician_id,
  tt.state AS technician_state,
  tt.started_at AS technician_started_at,
  tt.cancelled_by AS technician_cancelled_by,
  tt.cancel_reason_description AS technician_cancel_reason_description,
  tcr.label AS technician_cancel_reason_label,
  tcr.id AS technician_cancel_reason_id,
  tt.deleted_at AS technician_deleted_at,
  tt.cancelled_at AS technician_cancelled_at,
  tt.cancelled_by_id AS cancelledById,
  tt.finished_at AS finishedAt,
  tt.auto_close_at AS autoCloseAt,
  c.reference
FROM gf_contract_data_internet gdi
INNER JOIN delinternet_hub.global_users gu
  ON gu.user_id = gdi.installatorUserId
LEFT JOIN gf_contracts c
  ON c.id = gdi.contractId
LEFT JOIN active_gf_fees_view affv
  ON c.feeGroupId = affv.feeGroupId
LEFT JOIN delinternet_hub.technician_tasks tt
  ON tt.type_id = gdi.id AND tt.type = IF(affv.internetTechnology = 'fibra', 'installation/fibra', 'installation/radio')
LEFT JOIN delinternet_hub.technician_cancel_reasons tcr
  ON tt.cancel_reason_id = tcr.id
WHERE gdi.status = 1
  AND c.status = 1
  AND c.id IS NOT NULL;

    `);
  },

  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP VIEW technician_tasks_view`);
  },
};
