const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Institution = sequelize.define('Institution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  type: {
    type: DataTypes.ENUM('coaching', 'school', 'institution'),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING
  },
  whatsapp: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  website: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING,
    index: true
  },
  state: {
    type: DataTypes.STRING,
    index: true
  },
  pincode: {
    type: DataTypes.STRING
  },
  source: {
    type: DataTypes.STRING
  },
  scrapedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'institution',
  indexes: [
    {
      fields: ['name', 'city', 'state']
    }
  ]
});

module.exports = Institution;