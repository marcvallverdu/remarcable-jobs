-- Add AI-powered analysis fields to Job table
ALTER TABLE "Job" ADD COLUMN "aiSalaryCurrency" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiSalaryValue" DOUBLE PRECISION;
ALTER TABLE "Job" ADD COLUMN "aiSalaryMinValue" DOUBLE PRECISION;
ALTER TABLE "Job" ADD COLUMN "aiSalaryMaxValue" DOUBLE PRECISION;
ALTER TABLE "Job" ADD COLUMN "aiSalaryUnitText" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiBenefits" TEXT[] DEFAULT '{}';
ALTER TABLE "Job" ADD COLUMN "aiExperienceLevel" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiWorkArrangement" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiWorkArrangementOfficeDays" INTEGER;
ALTER TABLE "Job" ADD COLUMN "aiRemoteLocation" TEXT[] DEFAULT '{}';
ALTER TABLE "Job" ADD COLUMN "aiRemoteLocationDerived" TEXT[] DEFAULT '{}';
ALTER TABLE "Job" ADD COLUMN "aiKeySkills" TEXT[] DEFAULT '{}';
ALTER TABLE "Job" ADD COLUMN "aiCoreResponsibilities" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiRequirementsSummary" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiHiringManagerName" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiHiringManagerEmailAddress" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiWorkingHours" INTEGER;
ALTER TABLE "Job" ADD COLUMN "aiEmploymentType" TEXT[] DEFAULT '{}';
ALTER TABLE "Job" ADD COLUMN "aiJobLanguage" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiVisaSponsorship" BOOLEAN;

-- Add missing LinkedIn fields to Organization table
ALTER TABLE "Organization" ADD COLUMN "linkedinSlogan" TEXT;
ALTER TABLE "Organization" ADD COLUMN "linkedinRecruitmentAgency" BOOLEAN;