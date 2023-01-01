module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('global_users', 'dni', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('global_users', 'dni', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
