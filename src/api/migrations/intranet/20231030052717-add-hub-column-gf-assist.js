'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_assists', 'hubImage1', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage2', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage3', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage4', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage5', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage6', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage7', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage8', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage9', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage10', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage11', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubImage12', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubSigned', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('gf_assists', 'hubWillShipImage', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gf_assists', 'hubImage1');
    await queryInterface.removeColumn('gf_assists', 'hubImage2');
    await queryInterface.removeColumn('gf_assists', 'hubImage3');
    await queryInterface.removeColumn('gf_assists', 'hubImage4');
    await queryInterface.removeColumn('gf_assists', 'hubImage5');
    await queryInterface.removeColumn('gf_assists', 'hubImage6');
    await queryInterface.removeColumn('gf_assists', 'hubImage7');
    await queryInterface.removeColumn('gf_assists', 'hubImage8');
    await queryInterface.removeColumn('gf_assists', 'hubImage9');
    await queryInterface.removeColumn('gf_assists', 'hubImage10');
    await queryInterface.removeColumn('gf_assists', 'hubImage11');
    await queryInterface.removeColumn('gf_assists', 'hubImage12');
    await queryInterface.removeColumn('gf_assists', 'hubSigned');
    await queryInterface.removeColumn('gf_assists', 'hubWillShipImage');
  },
};
