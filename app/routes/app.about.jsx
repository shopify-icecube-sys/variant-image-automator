import { boundary } from "@shopify/shopify-app-react-router/server";

export default function AboutPage() {
  return (
    <s-page heading="Quick Guide: How to use the app?">
      <s-section>
        <div style={{ display: "flex", gap: "24px", alignItems: "center", backgroundColor: "#f4f6f8", padding: "24px", borderRadius: "12px" }}>
          <div style={{ flex: 1 }}>
            <s-heading>What does this app do?</s-heading>
            <s-paragraph style={{ color: "#202223", marginTop: "8px", fontSize: "15px" }}>
              The app helps you organize your product images. By default, it does nothing. 
              But for the collections you select, it makes your gallery smarter!
            </s-paragraph>
          </div>
          <img src="/guide.png" alt="App Guide" style={{ width: "200px", height: "auto", borderRadius: "8px" }} />
        </div>
      </s-section>

      <s-section>
        <s-stack direction="block" gap="loose">
          {/* Default */}
          <div style={{ padding: "20px", border: "1px solid #dfe3e8", borderRadius: "8px" }}>
            <s-heading>1. Default Shopify Behavior</s-heading>
            <s-paragraph style={{ marginTop: "8px", color: "#6d7175" }}>
              For all products, your gallery will work exactly like standard Shopify. 
              No images will be hidden or moved.
            </s-paragraph>
          </div>

          {/* Reorder Mode */}
          <div style={{ padding: "20px", border: "1px solid #dfe3e8", borderRadius: "8px" }}>
            <s-heading>2. Reorder Mode (Selected Collections)</s-heading>
            <s-paragraph style={{ marginTop: "8px", color: "#6d7175" }}>
              In the collections you choose, the app will show all images, but it will 
              move the ones belonging to the <strong>selected variant to the Top</strong>.
            </s-paragraph>
          </div>
        </s-stack>
      </s-section>

      <s-section>
        <s-heading>Simple Setup Steps</s-heading>
        <div style={{ marginTop: "12px" }}>
          <s-paragraph style={{ color: "#6d7175" }}>
            1. Put all images of the same color together in Shopify Media.<br/>
            2. Assign the main image to your variant.<br/>
            3. The app will automatically handle the grouping for you!
          </s-paragraph>
        </div>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
