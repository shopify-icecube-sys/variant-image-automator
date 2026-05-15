-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "hideFirstImage" BOOLEAN NOT NULL DEFAULT false,
    "showCommonImages" BOOLEAN NOT NULL DEFAULT true,
    "preserveFeatured" BOOLEAN NOT NULL DEFAULT false,
    "applyToAll" BOOLEAN NOT NULL DEFAULT true,
    "reorderCollections" TEXT NOT NULL DEFAULT '[]',
    "activeCollections" TEXT NOT NULL DEFAULT '[]'
);
INSERT INTO "new_AppSettings" ("hideFirstImage", "preserveFeatured", "shop", "showCommonImages") SELECT "hideFirstImage", "preserveFeatured", "shop", "showCommonImages" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
