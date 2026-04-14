-- CreateEnum
CREATE TYPE "ProjectPurpose" AS ENUM ('ONGOING_TRACKING', 'DIAGNOSTIC_COLLECTION');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "description" TEXT,
ADD COLUMN     "familyHistory" TEXT,
ADD COLUMN     "onsetDate" DATE,
ADD COLUMN     "purpose" "ProjectPurpose",
ADD COLUMN     "teenBirthday" DATE,
ADD COLUMN     "teenDiagnosis" TEXT,
ADD COLUMN     "teenFavoriteColor" TEXT,
ADD COLUMN     "teenFavoriteSubject" TEXT,
ADD COLUMN     "teenFullName" TEXT,
ADD COLUMN     "teenHasIep" BOOLEAN,
ADD COLUMN     "teenInterests" TEXT,
ADD COLUMN     "teenNickname" TEXT,
ADD COLUMN     "teenOtherHealth" TEXT,
ADD COLUMN     "teenPhotoUrl" TEXT,
ADD COLUMN     "teenSchool" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "defaultTenantId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_defaultTenantId_fkey" FOREIGN KEY ("defaultTenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
