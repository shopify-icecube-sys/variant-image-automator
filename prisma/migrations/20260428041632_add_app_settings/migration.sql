-- CreateTable
CREATE TABLE "AppSettings" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "hideFirstImage" BOOLEAN NOT NULL DEFAULT false,
    "showCommonImages" BOOLEAN NOT NULL DEFAULT true,
    "preserveFeatured" BOOLEAN NOT NULL DEFAULT false
);
