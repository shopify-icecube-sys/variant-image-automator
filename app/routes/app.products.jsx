import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query getProducts {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }`,
  );

  const responseJson = await response.json();
  const products = responseJson.data.products.edges;

  return {
    products,
  };
};

export default function ProductsPage() {
  const { products } = useLoaderData();
  const navigate = useNavigate();

  return (
    <s-page heading="Product List">
      <s-section>
        <s-button onClick={() => navigate("/app")}>Back to Home</s-button>
      </s-section>

      <s-section>
        <s-stack direction="block" gap="loose">
          {products.map(({ node: product }) => (
            <div 
              key={product.id} 
              style={{ 
                padding: "16px", 
                border: "1px solid #e1e3e5", 
                borderRadius: "8px",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start"
              }}
            >
              {product.featuredImage ? (
                <img 
                  src={product.featuredImage.url} 
                  alt={product.featuredImage.altText || product.title}
                  style={{ width: "80px", height: "80px", borderRadius: "4px", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "80px", height: "80px", backgroundColor: "#f6f6f7", borderRadius: "4px" }} />
              )}
              
              <div style={{ flex: 1 }}>
                <s-heading>{product.title}</s-heading>
                <s-paragraph style={{ color: "#6d7175", marginBottom: "8px" }}>
                  {product.variants.edges.length} variants found
                </s-paragraph>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {product.variants.edges.map(({ node: variant }) => (
                    <span 
                      key={variant.id}
                      style={{
                        backgroundColor: "#f1f1f1",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#202223",
                        border: "1px solid #d1d3d6"
                      }}
                    >
                      {variant.title} {variant.image ? "🖼️" : "❌"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </s-stack>
      </s-section>
    </s-page>
  );
}
