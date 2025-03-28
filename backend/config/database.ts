import { PostgresDialectConfig } from "kysely";

type DatabaseName =
  | "readOnlyIndexerDatabase"
  | "readOnlyAnalyticsDatabase"
  | "readOnlyTelemetryDatabase"
  | "writeOnlyTelemetryDatabase";

export const databaseConfigs: Record<DatabaseName, PostgresDialectConfig> = {
  readOnlyIndexerDatabase: {
    host: process.env.NEAR_READ_ONLY_INDEXER_DATABASE_HOST,
    database: process.env.NEAR_READ_ONLY_INDEXER_DATABASE_NAME,
    user: process.env.NEAR_READ_ONLY_INDEXER_DATABASE_USERNAME,
    password: process.env.NEAR_READ_ONLY_INDEXER_DATABASE_PASSWORD,
  },
  readOnlyAnalyticsDatabase: {
    host: process.env.NEAR_READ_ONLY_ANALYTICS_DATABASE_HOST,
    database: process.env.NEAR_READ_ONLY_ANALYTICS_DATABASE_NAME,
    user: process.env.NEAR_READ_ONLY_ANALYTICS_DATABASE_USERNAME,
    password: process.env.NEAR_READ_ONLY_ANALYTICS_DATABASE_PASSWORD,
  },
  readOnlyTelemetryDatabase: {
    host: process.env.NEAR_READ_ONLY_TELEMETRY_DATABASE_HOST,
    database: process.env.NEAR_READ_ONLY_TELEMETRY_DATABASE_NAME,
    user: process.env.NEAR_READ_ONLY_TELEMETRY_DATABASE_USERNAME,
    password: process.env.NEAR_READ_ONLY_TELEMETRY_DATABASE_PASSWORD,
  },
  writeOnlyTelemetryDatabase: {
    host: process.env.NEAR_WRITE_ONLY_TELEMETRY_DATABASE_HOST,
    database: process.env.NEAR_WRITE_ONLY_TELEMETRY_DATABASE_NAME,
    user: process.env.NEAR_WRITE_ONLY_TELEMETRY_DATABASE_USERNAME,
    password: process.env.NEAR_WRITE_ONLY_TELEMETRY_DATABASE_PASSWORD,
    min: 0,
    max: 15,
  },
};
