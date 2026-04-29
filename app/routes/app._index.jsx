import * as fs from "node:fs/promises";
import { useLoaderData, useNavigate, useSubmit } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSettings, updateSettings } from "../models/Settings.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Convert string booleans to actual booleans
  const settings = {
    hideFirstImage: data.hideFirstImage === "true",
    showCommonImages: data.showCommonImages === "true",
    preserveFeatured: data.preserveFeatured === "true",
    applyToAll: data.applyToAll === "true",
  };

  await updateSettings(session.shop, settings);

  try {
    const { admin } = await authenticate.admin(request);
    const shopResponse = await admin.graphql(`{ shop { id } }`);
    const shopData = await shopResponse.json();
    const shopId = shopData.data.shop.id;

    await admin.graphql(
      `#graphql
      mutation CreateMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafieldsSetInput) {
          userErrors { field message }
        }
      }`,
      {
        variables: {
          metafieldsSetInput: [
            {
              namespace: "variant_image_automator",
              key: "apply_to_all",
              type: "boolean",
              value: settings.applyToAll.toString(),
              ownerId: shopId
            }
          ]
        }
      }
    );
  } catch (e) {
    console.error("Metafield sync error:", e);
  }

  return { success: true };
};

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  let isPublished = false;

  try {
    const response = await admin.graphql(
      `#graphql
      query {
        themes(first: 10) {
          edges {
            node {
              id
              role
              name
            }
          }
        }
      }`,
    );
    const themesJson = await response.json();

    if (themesJson.errors) {
      console.error("GraphQL Errors:", themesJson.errors);
    } else {
      const themes = themesJson.data.themes.edges.map((e) => e.node);

      // Prioritize themes: MAIN > DEVELOPMENT > Others
      const targetTheme =
        themes.find((t) => t.role === "MAIN") ||
        themes.find((t) => t.role === "DEVELOPMENT") ||
        themes[0];

      if (targetTheme) {
        const themeId = targetTheme.id.split("/").pop();
        try {
          // Add cache busting timestamp
          const assetResponse = await fetch(
            `https://${session.shop}/admin/api/2024-07/themes/${themeId}/assets.json?asset[key]=config/settings_data.json&t=${Date.now()}`,
            {
              headers: {
                "X-Shopify-Access-Token": session.accessToken,
              },
            },
          );

          if (assetResponse.ok) {
            const assetData = await assetResponse.json();
            const settings = JSON.parse(assetData.asset.value);
            const blocks = settings.current?.blocks || {};

            // Find the specific block for our app
            const myBlock = Object.values(blocks).find(
              (block) =>
                block.type?.includes("image-automator") &&
                block.type?.includes("app_embed"),
            );

            isPublished = myBlock && myBlock.disabled === false;
          }
        } catch (e) {
          console.error("Error checking target theme:", e);
        }
      }
    }
  } catch (error) {
    console.error("Error checking theme status:", error);
    isPublished = false;
  }

  // Fetch product count
  let productCount = 0;
  try {
    const productCountResponse = await admin.graphql(
      `#graphql
      query {
        productsCount {
          count
        }
      }`,
    );
    const productCountJson = await productCountResponse.json();
    productCount = productCountJson.data.productsCount.count;
  } catch (error) {
    console.error("Error fetching product count:", error);
  }

  const settings = await getSettings(session.shop);

  return {
    shop: session.shop,
    isPublished,
    productCount,
    settings: {
      ...settings,
      applyToAll: settings.applyToAll ?? true
    },
  };
};



export default function Index() {
  const { shop, isPublished, productCount, settings } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  const handleSettingChange = (settingName, value) => {
    const newSettings = {
      ...settings,
      [settingName]: value,
    };
    submit(newSettings, { method: "post" });
  };

  return (
    <s-page heading="Variant Image Automator">
      <s-section>
        <s-stack direction="inline" gap="extraLoose" align="center" style={{ width: "100%" }}>
          <s-stack direction="block" gap="base" style={{ flex: 3, minWidth: "0" }}>
            <s-stack direction="inline" gap="base" align="center">
              <s-heading>Activate app</s-heading>
              <span
                style={{
                  backgroundColor: isPublished ? "#ccf0d1" : "#fff4e5",
                  color: isPublished ? "#005e0d" : "#703c00",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "13px",
                  fontWeight: "500",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: isPublished ? "#008060" : "#b98900",
                    borderRadius: "50%",
                  }}
                ></span>
                {isPublished ? "Published" : "Not published"}
              </span>
            </s-stack>
            <s-paragraph style={{ color: "#6d7175", fontSize: "14px" }}>
              Add the app embed to your theme to enable the app. You can apply
              it to the published theme or test it on an unpublished theme.
            </s-paragraph>
            <div style={{ marginTop: "12px" }}>
              <s-stack direction="inline" gap="base">
                <s-button
                  variant="primary"
                  onClick={() => window.open(themeEditorUrl, "_blank")}
                >
                  Enable app embed
                </s-button>
                <s-button onClick={() => navigate("/app/themes")}>
                  Select theme
                </s-button>
              </s-stack>
            </div>
          </s-stack>
        </s-stack>
      </s-section>


      <s-section>
        <s-heading>How it works</s-heading>
        <div style={{ marginTop: "12px" }}>
          <s-paragraph style={{ color: "#202223", fontWeight: "500" }}>
            Follow these steps to set up your variant images:
          </s-paragraph>
          <ul style={{ 
            marginTop: "8px", 
            paddingLeft: "20px", 
            color: "#6d7175", 
            fontSize: "14px",
            lineHeight: "1.6"
          }}>
            <li><strong>Arrange Media:</strong> Place all images of a variant together in your Shopify Product Media section.</li>
            <li><strong>Assign First Image:</strong> Assign the first image of each group to its corresponding variant as the primary image.</li>
            <li><strong>Automatic Display:</strong> The app will automatically show the entire group of images when that variant is selected.</li>
          </ul>
        </div>
      </s-section>

      <s-section>
        <s-heading>Select app scope</s-heading>
        <s-paragraph style={{ color: "#6d7175", fontSize: "13px", marginTop: "4px" }}>
          Choose whether the app works on all products or limited products
        </s-paragraph>
        <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#f6f6f7", borderRadius: "8px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <input 
              type="checkbox" 
              checked={settings.applyToAll}
              onChange={(e) => handleSettingChange("applyToAll", e.target.checked)}
              style={{ width: "18px", height: "18px", marginTop: "2px" }}
            />
            <div>
              <p style={{ fontWeight: "600", fontSize: "14px" }}>Apply to all products</p>
              <p style={{ fontSize: "13px", color: "#6d7175" }}>The app will work on all products in your store</p>
            </div>
          </div>
        </div>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
