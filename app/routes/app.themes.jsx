import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `#graphql
      query {
        themes(first: 20) {
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
    const allThemes = themesJson.data.themes.edges.map((e) => e.node);
    
    // Filter out development themes used by Shopify CLI
    const themes = allThemes.filter((t) => t.role !== "DEVELOPMENT");

    const themesWithStatus = await Promise.all(
      themes.map(async (theme) => {
        const themeId = theme.id.split("/").pop();
        let isEnabled = false;
        try {
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
            const myBlock = Object.values(blocks).find(
              (block) =>
                block.type?.includes("image-automator") &&
                block.type?.includes("app_embed"),
            );
            isEnabled = myBlock && myBlock.disabled === false;
          }
        } catch (e) {
          console.error(`Error checking theme ${themeId}:`, e);
        }
        return { ...theme, isEnabled, themeId };
      }),
    );

    return { themes: themesWithStatus, shop: session.shop };
  } catch (error) {
    console.error("Error loading themes page:", error);
    return { themes: [], shop: "" };
  }
};

export default function ThemesPage() {
  const { themes, shop } = useLoaderData();
  const navigate = useNavigate();

  const publishedTheme = themes.find((t) => t.role === "MAIN");
  const unpublishedThemes = themes.filter((t) => t.role !== "MAIN");

  const renderThemeRow = (theme) => {
    const editorUrl = `https://${shop}/admin/themes/${theme.themeId}/editor?context=apps`;

    return (
      <div
        key={theme.id}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #f1f1f1",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: `2px solid ${theme.isEnabled ? "#008060" : "#d1d1d1"}`,
              color: theme.isEnabled ? "#008060" : "#d1d1d1",
            }}
          >
            {theme.isEnabled && (
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: "14px" }}>
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <span style={{ fontWeight: "600", color: "#202223" }}>{theme.name}</span>
          {theme.role === "MAIN" && (
            <span
              style={{
                backgroundColor: "#f1f1f1",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#6d7175",
              }}
            >
              Main theme
            </span>
          )}
        </div>
        <button
          onClick={() => window.open(editorUrl, "_blank")}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d3d6",
            backgroundColor: "#fff",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            color: "#202223",
          }}
        >
          Manage app embed
        </button>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: "#f6f6f7", minHeight: "100vh", padding: "40px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button
            onClick={() => navigate("/app")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg viewBox="0 0 20 20" fill="#5c5f62" style={{ width: "20px" }}>
              <path d="M17 9H5.414l3.293-3.293a1 1 0 10-1.414-1.414l-5 5a1 1 0 000 1.414l5 5a1 1 0 001.414-1.414L5.414 11H17a1 1 0 100-2z" />
            </svg>
          </button>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#202223" }}>
            Manage app on themes
          </h1>
        </div>

        {publishedTheme && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginBottom: "24px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f1f1" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "600", color: "#202223" }}>
                Published theme
              </h2>
            </div>
            {renderThemeRow(publishedTheme)}
          </div>
        )}

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f1f1" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "600", color: "#202223" }}>
              Unpublished theme
            </h2>
          </div>
          {unpublishedThemes.map(renderThemeRow)}
        </div>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
