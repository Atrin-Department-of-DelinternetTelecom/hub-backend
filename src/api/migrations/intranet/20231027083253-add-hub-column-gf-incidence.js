'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_incidences', 'hubFile1', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_incidences', 'hubFile2', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_incidences', 'hubFile3', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_incidences', 'hubFile4', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_incidences', 'hubFile5', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_incidences', 'hubFile6', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gf_incidences', 'hubFile1');
    await queryInterface.removeColumn('gf_incidences', 'hubFile2');
    await queryInterface.removeColumn('gf_incidences', 'hubFile3');
    await queryInterface.removeColumn('gf_incidences', 'hubFile4');
    await queryInterface.removeColumn('gf_incidences', 'hubFile5');
    await queryInterface.removeColumn('gf_incidences', 'hubFile6');
  },
};
