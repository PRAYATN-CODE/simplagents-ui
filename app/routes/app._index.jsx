import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppContext } from "../context/AppContext";
import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const shopRes = await admin.graphql(`
    query {
      shop {
        name
        email
        myshopifyDomain
        plan {
          displayName
        }
      }
    }
  `);

  const shopJson = await shopRes.json();

  return Response.json({
    shop: shopJson.data.shop,
    shopDomain: session.shop,
    session: {
      id: session.id,
      shop: session.shop,
      isOnline: session.isOnline,
      scope: session.scope,
    },
    sessionData: session,
  });
};


export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {

  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const adminData = useLoaderData();
  const [embedScript, setEmbedScript] = useState("");
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState(null);

  const {
    activeAgent,
    setActiveAgent,
    setAccountId,
    fetchAgents,
    loading,
  } = useAppContext();

  console.log(activeAgent)

  useEffect(() => {
    fetchAgents();
  }, []);

  const isLoading = ["loading", "submitting"].includes(fetcher.state) && fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const handleEmbedScript = async () => {
    if (!embedScript.trim()) {
      shopify.toast.show("Please paste a script first", { isError: true });
      return;
    }

    setIsEmbedding(true);

    try {
      const res = await fetch("/api/save-embed-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: embedScript,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to embed script");
      }

      shopify.toast.show("SimplAgents script embedded successfully 🎉");
      setEmbedScript("");
    } catch (err) {
      shopify.toast.show(err.message || "Something went wrong", {
        isError: true,
      });
    } finally {
      setIsEmbedding(false);
    }
  };

  const scriptTemplate = (appId) => `
<script>
  window.chatModalSettings = { "appId": "${appId}", "skin": "Modern" };
  (function () {
    var t = window,
      e = t.chatModal,
      a = e && !!e.loaded,
      n = document,
      r = function () { r.m(arguments); };
    r.q = [];
    r.m = function (t) { r.q.push(t); };
    t.chatModal = a ? e : r;
    var o = function () {
      var e = n.createElement("script");
      e.type = "text/javascript";
      e.async = true;
      e.src = "https://chat.shambho.ai/embeded-script.js";
      e.onerror = function () { t.chatModal.loaded = false; };
      e.onload = function () { t.chatModal.loaded = true; t.renderChatModal(); };
      var a = n.getElementsByTagName("script")[0];
      a.parentNode.insertBefore(e, a);
    };
    "function" === typeof e ? a ? e("update", t.chatModalSettings) : o()
      : "loading" !== n.readyState ? o()
      : n.addEventListener("DOMContentLoaded", o);
  })();
</script>
`.trim();

  useEffect(() => {
    const fetchAccountId = async () => {
      try {
        const res = await fetch("/api/chat-id");
        const data = await res.json();

        if (data.accountId) {
          setActiveAccountId(data.accountId);
          setEmbedScript(scriptTemplate(data.accountId));
        }
      } catch (err) {
        console.error("Failed to load accountId");
      }
    };

    fetchAccountId();
  }, []);

  const fetchShambhoAgents = async () => {
    setLoadingAgents(true);

    try {
      const res = await fetch("/api/shambho-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch agents");
      }

      setAgents(data.data); // [{ accountId, agentId }]
    } catch (err) {
      shopify.toast.show(err.message || "Failed to load agents", {
        isError: true,
      });
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    fetchShambhoAgents();
  }, []);

  useEffect(() => {
    if (!activeAccountId || agents.length === 0) return;

    const defaultAgent = agents.find(
      (agent) => agent.accountId === activeAccountId
    );

    if (defaultAgent) {
      setSelectedAgent(defaultAgent);
    }
  }, [activeAccountId, agents]);

  // console.log(adminData)

  return (
    <s-page heading="Shopify app template">

      <s-section heading="Store Information">
        <s-stack direction="block" gap="base">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-text>
              <strong>Store Name:</strong> {adminData.shop.name}
            </s-text>
            <s-text>
              <strong>Domain:</strong> {adminData.shop.myshopifyDomain}
            </s-text>
            <s-text>
              <strong>Plan:</strong> {adminData.shop.plan.displayName}
            </s-text>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Select Agent and Embed Script">
        {agents.length > 0 && (
          <s-select
            label="Select Agent"
            placeholder="Choose an agent"
            value={selectedAgent?.agentId || ""}
            onChange={(event) => {
              const value = event.target.value;
              const agent = agents.find((a) => a.agentId === value);
              setSelectedAgent(agent);
              setActiveAccountId(agent.accountId);
              setEmbedScript(scriptTemplate(agent.accountId));
              shopify.toast.show(`Agent selected: ${agent.agentId}`);
            }}
          >
            {agents.map((agent) => (
              <s-option key={agent.agentId} value={agent.agentId}>
                Agent Name: {agent?.agentName}
              </s-option>
            ))}
          </s-select>
        )}
        {activeAccountId && (
          <s-stack direction="inline" gap="base">
            <s-button
              variant="primary"
              onClick={handleEmbedScript}
              disabled={!activeAccountId}
              {...(isEmbedding ? { loading: true } : {})}
            >
              Embed Script
            </s-button>

            <s-stack direction="block" gap="extraSmall">
              <s-text tone="subdued">
                Script will be injected into storefront &lt;head&gt;
              </s-text>

              <s-text tone="subdued">
                After embedding, go to <strong>Online Store → Themes → Customize</strong> and
                enable the <strong>SimplAgents Chat Modal</strong> to make it visible on your store.
              </s-text>
            </s-stack>
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
