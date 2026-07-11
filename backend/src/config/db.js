const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'data_scrapr'}`;
const useSsl = /sslmode=require|ssl=true|neon.tech/i.test(databaseUrl) || process.env.DB_SSL === 'true';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSsl ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Neon PostgreSQL connected successfully');

    await sequelize.sync({ force: false, alter: false });
    console.log('Database synced');
  } catch (error) {
    console.error('Unable to connect to Neon PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };