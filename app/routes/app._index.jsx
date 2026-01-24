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
          setEmbedScript(scriptTemplate(data.accountId));
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

      {/* STORE INFO */}
      <s-section heading="Store Information">
        <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
          <s-text><strong>Store:</strong> {adminData.shop.name}</s-text>
          <s-text><strong>Domain:</strong> {adminData.shop.myshopifyDomain}</s-text>
          <s-text><strong>Plan:</strong> {adminData.shop.plan.displayName}</s-text>
        </s-box>
      </s-section>

      {/* AGENT SELECT */}
      <s-section heading="Select Agent">
        {agents.length > 0 && (
          <s-select
            label="Agent"
            value={activeAgent?.agentId || ""}
            onChange={(e) => {
              const agent = agents.find(a => a.agentId === e.target.value);
              setActiveAgent(agent);
              shopify.toast.show(`Agent selected: ${agent.agentName}`);
            }}
          >
            {agents.map(agent => (
              <s-option key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </s-option>
            ))}
          </s-select>
        )}
      </s-section>

      {/* EMBED */}
      {accountId && (
        <s-section heading="Embed Script">
          <s-button
            variant="primary"
            onClick={handleEmbedScript}
            loading={isEmbedding}
          >
            Embed Script
          </s-button>

          <s-text tone="subdued">
            Script will be injected into storefront &lt;head&gt;
          </s-text>

          <s-text tone="subdued">
            After embedding, go to <strong>Online Store → Themes → Customize</strong> and
            enable <strong>SimplAgents Chat Modal</strong>.
          </s-text>
        </s-section>
      )}
    </s-page>
  );
}

/* ---------------- SCRIPT TEMPLATE ---------------- */

const scriptTemplate = (appId) => `
<script>
  window.chatModalSettings = { "appId": "${appId}", "skin": "Modern" };
  (function () {
    var t = window, e = t.chatModal, a = e && !!e.loaded, n = document;
    var r = function () { r.m(arguments); };
    r.q = []; r.m = function (t) { r.q.push(t); };
    t.chatModal = a ? e : r;
    var o = function () {
      var s = n.createElement("script");
      s.async = true;
      s.src = "https://chat.shambho.ai/embeded-script.js";
      s.onload = function () { t.chatModal.loaded = true; t.renderChatModal(); };
      n.head.appendChild(s);
    };
    a ? e("update", t.chatModalSettings) : o();
  })();
</script>
`.trim();

export const headers = (headersArgs) => boundary.headers(headersArgs);
