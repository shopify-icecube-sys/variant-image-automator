import db from "../db.server";

export async function getSettings(shop) {
  const settings = await db.appSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    return {
      shop,
      hideFirstImage: false,
      showCommonImages: true,
      preserveFeatured: false,
      applyToAll: true,
    };
  }

  return settings;
}

export async function updateSettings(shop, data) {
  return await db.appSettings.upsert({
    where: { shop },
    update: data,
    create: {
      shop,
      ...data,
    },
  });
}
