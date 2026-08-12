ALTER TABLE "Programme" ADD COLUMN "intakeKey" TEXT;
CREATE UNIQUE INDEX "Programme_intakeKey_key" ON "Programme"("intakeKey");
