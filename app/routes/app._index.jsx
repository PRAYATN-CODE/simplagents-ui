import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useShambho } from "../context/ShambhoContext";
import { authenticate } from "../shopify.server";

/* ---------------- LOADER ---------------- */

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
  });
};

/* ---------------- COMPONENT ---------------- */

export default function Index() {
  const shopify = useAppBridge();
  const fetcher = useFetcher();
  const adminData = useLoaderData();

  /* -------- CONTEXT -------- */
  const {
    agents,
    activeAgent,
    accountId,
    loading,
    initializeAccount,
    setActiveAgent,
  } = useShambho();

  /* -------- LOCAL UI STATE -------- */
  const [embedScript, setEmbedScript] = useState("");
  const [isEmbedding, setIsEmbedding] = useState(false);

  /* -------- INIT ACCOUNT (ONCE) -------- */
  useEffect(() => {
    initializeAccount();
  }, []);

  /* -------- KEEP THIS FUNCTION (AS REQUESTED) -------- */
  useEffect(() => {
    const fetchAccountId = async () => {
      try {
        const res = await fetch("/api/chat-id");
        const data = await res.json();

        if (data?.accountId) {
          // setEmbedScript(scriptTemplate(data.accountId));
          console.log(data)
        }
      } catch (err) {
        console.error("Failed to load accountId");
      }
    };

    fetchAccountId();
  }, []);

  /* -------- UPDATE SCRIPT WHEN AGENT CHANGES -------- */
  useEffect(() => {
    if (activeAgent?.accountId) {
      setEmbedScript(scriptTemplate(activeAgent.accountId));
    }
  }, [activeAgent]);

  /* -------- EMBED SCRIPT -------- */
  const handleEmbedScript = async () => {
    if (!embedScript) {
      shopify.toast.show("Script not ready", { isError: true });
      return;
    }

    setIsEmbedding(true);

    try {
      const res = await fetch("/api/save-embed-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: embedScript }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to embed script");
      }

      shopify.toast.show("SimplAgents script embedded successfully 🎉");
    } catch (err) {
      shopify.toast.show(err.message, { isError: true });
    } finally {
      setIsEmbedding(false);
    }
  };

  if (loading) {
    return (
      <s-page heading="SimplAgents Shopify App">
        <s-section>
          <s-stack direction="block" gap="base" align="center">
            <s-spinner size="large" />
            <s-text tone="subdued">
              Setting up SimplAgents for your store…
            </s-text>
          </s-stack>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="SimplAgents Shopify App">

      <s-section>
        <s-stack direction="inline" align="space-between" gap="base">
          <s-text variant="headingMd">
            SimplAgents Dashboard
          </s-text>

          <s-button
            variant="secondary"
            onClick={() => {
              shopify.toast.show("Refreshing account data…");
              initializeAccount();
            }}
          >
            Refresh
          </s-button>
        </s-stack>
      </s-section>

      <s-section>
        <s-box
          borderWidth="base"
          borderRadius="large"
          overflow="hidden"
        >
          <img
            src="https://dnz6ajm5xo9z3.cloudfront.net/images/WhatsApp_Image_2026-01-29_at_10.25.28_PM.jpeg"
            alt="SimplAgents Preview"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "cover",
            }}
          />
        </s-box>
      </s-section>

      {/* STORE INFO */}
      <s-section heading="Store Information">
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="large"
          background="subdued"
        >
          <s-stack direction="block" gap="small">
            <s-text>
              <strong>Store:</strong> {adminData.shop.name}
            </s-text>
            <s-text>
              <strong>Domain:</strong> {adminData.shop.myshopifyDomain}
            </s-text>
            <s-text>
              <strong>Plan:</strong> {adminData.shop.plan.displayName}
            </s-text>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Agent Setup">
        <s-stack direction="block" gap="base">

          {/* Agent Selector */}
          <s-box maxWidth="420px">
            {agents.length > 0 && (
              <s-select
                label="Choose Agent"
                value={activeAgent?.agentId || ""}
                onChange={(e) => {
                  const agent = agents.find(a => a.agentId === e.target.value);
                  setActiveAgent(agent);
                  shopify.toast.show(`Agent selected: ${agent.agentName}`);
                }}
              >
                <s-option value="">Select Agent</s-option>
                {agents.map(agent => (
                  <s-option key={agent.agentId} value={agent.agentId}>
                    {agent.agentName}
                  </s-option>
                ))}
              </s-select>
            )}
          </s-box>

          {/* Only show when agent selected */}
          {activeAgent && (
            <s-stack direction="block" gap="base">

              {/* Test Link */}
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="large"
                background="subdued"
              >
                <s-stack direction="block" gap="extraSmall">
                  <s-text variant="headingSm">
                    Test Your Agent
                  </s-text>

                  <s-text tone="subdued">
                    Open this link to preview your chatbot:
                  </s-text>

                  <a
                    href={`https://chat.simplagents.com/ui?appId=${activeAgent?.accountId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--p-color-text-link)",
                      fontWeight: 500,
                      wordBreak: "break-all",
                    }}
                  >
                    {`https://chat.simplagents.com/ui?appId=${activeAgent?.accountId}`}
                  </a>
                </s-stack>
              </s-box>

              {/* Embed Section */}
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="large"
              >
                <s-stack direction="block" gap="base">

                  <s-text variant="headingSm">
                    Embed Chat Widget
                  </s-text>

                  <s-text tone="subdued">
                    Inject the chat widget directly into your storefront theme.
                  </s-text>

                  <s-button
                    variant="primary"
                    onClick={handleEmbedScript}
                    loading={isEmbedding}
                  >
                    Embed Script
                  </s-button>

                  <s-text tone="subdued">
                    After embedding go to:
                    <br />
                    <strong>Online Store → Themes → Customize</strong>
                    <br />
                    Enable <strong>SimplAgents Chat Modal</strong>.
                  </s-text>

                </s-stack>
              </s-box>

            </s-stack>
          )}

        </s-stack>
      </s-section>

    </s-page>
  );
}

/* ---------------- SCRIPT TEMPLATE ---------------- */

const scriptTemplate = (appId) => `

  <script id="shambhoai-chat-widget" data-app-id="${appId}" data-skin="Modern">
    (function () {
      if (window.__SHAMBHOAI_WIDGET_LOADED__) return;
      window.__SHAMBHOAI_WIDGET_LOADED__ = true;

      // Read config from script tag
      var script = document.currentScript;
      var appId = script.getAttribute("data-app-id");
      var skin = script.getAttribute("data-skin") || "Modern";

      // Expose global config
      window.chatModalSettings = {
        appId: appId,
        skin: skin
      };

      // Load widget runtime
      var s = document.createElement("script");
      s.src = "https://chat-modal-script.vercel.app/embeded-script.js";
      s.async = true;

      s.onload = function () {
        if (typeof window.renderChatModal === "function") {
          window.renderChatModal();
        }
      };

      document.head.appendChild(s);
    })();
  </script>

`.trim();

export const headers = (headersArgs) => boundary.headers(headersArgs);
