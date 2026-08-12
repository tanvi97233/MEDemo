ALTER TABLE "Submission" ADD COLUMN "submissionKey" TEXT;
CREATE UNIQUE INDEX "Submission_submissionKey_key" ON "Submission"("submissionKey");
