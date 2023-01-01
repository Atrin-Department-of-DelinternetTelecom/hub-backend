'use strict';

const addressFields = [
  'addressRegion',
  'addressRegionCode',
  'addressRegionCodeName',
  'addressProvince',
  'addressProvinceCode',
  'addressProvinceCodeName',
  'addressCity',
  'addressCityCode',
  'addressCityCodeName',
  'addressPostalCode',
  'addressPostalCodeCode',
  'addressPostalCodeCodeName',
  'addressStreet',
  'addressStreetCode',
  'addressStreetCodeName',
  'addressStreetTypeCode',
  'addressStreetTypeCodeName',
  'addressNumber',
  'addressNumberCode',
  'addressNumberCodeName',
  'addressFloor',
  'addressFloorCode',
  'addressFloorCodeName',
  'addressBuilding',
  'addressBuildingCode',
  'addressBuildingCodeName',
  'addressDoor',
  'addressDoorCode',
  'addressDoorCodeName',
  'addressStairway',
  'addressStairwayCode',
  'addressStairwayCodeName',
  'addressLat',
  'addressLng',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.createTable('gf_sim_deliveries', {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      closed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      technicianUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ...Object.fromEntries(
        addressFields.map((key) => [
          key,
          {
            type: DataTypes.STRING,
            allowNull: true,
          },
        ]),
      ),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gf_sim_deliveries');
  },
};
