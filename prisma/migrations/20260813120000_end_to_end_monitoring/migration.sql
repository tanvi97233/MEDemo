-- Safe additive migration: preserve all existing programme and monitoring data.
ALTER TABLE "Programme" ADD COLUMN "assumptions" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Programme" ADD COLUMN "risks" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Indicator" ADD COLUMN "calculationType" TEXT NOT NULL DEFAULT 'COUNT';

ALTER TABLE "DataField" ADD COLUMN "definition" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DataField" ADD COLUMN "unit" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DataField" ADD COLUMN "validationRule" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DataField" ADD COLUMN "collectionFrequency" TEXT NOT NULL DEFAULT 'Quarterly';
ALTER TABLE "DataField" ADD COLUMN "calculationRole" TEXT NOT NULL DEFAULT 'SUPPORTING';
ALTER TABLE "DataField" ADD COLUMN "disaggregation" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DataField" ADD COLUMN "dataSource" TEXT NOT NULL DEFAULT 'UniCollector';

ALTER TABLE "Report" ADD COLUMN "comparisonPeriod" TEXT NOT NULL DEFAULT 'None';
ALTER TABLE "Report" ADD COLUMN "frameworkName" TEXT NOT NULL DEFAULT 'Standard M&E Report';
