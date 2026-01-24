import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";
import { useShambho } from "../context/ShambhoContext";

export default function EditAgentPage() {
    const shopify = useAppBridge();

    const {
        shambhoAccessToken,
        initializeAccount,
        loading,
    } = useShambho();

    const [iframeUrl, setIframeUrl] = useState("");
    const [showIframe, setShowIframe] = useState(false);

    /* -------- BUTTON CLICK HANDLER -------- */
    const handleLoadAccount = async () => {
        // Ensure context is initialized
        await initializeAccount();

        if (!shambhoAccessToken) {
            shopify.toast.show("Unable to load account. Please try again.", {
                isError: true,
            });
            return;
        }

        const url = `https://app.simplagents.com?token=${encodeURIComponent(
            shambhoAccessToken
        )}&isIframe=true`;

        setIframeUrl(url);
        setShowIframe(true);
    };

    /* -------- LOADING UI -------- */
    if (loading) {
        return (
            <s-page heading="Website Preview">
                <s-section>
                    <s-stack direction="block" gap="base" align="center">
                        <s-spinner size="large" />
                        <s-text tone="subdued">
                            Loading your SimplAgents account…
                        </s-text>
                    </s-stack>
                </s-section>
            </s-page>
        );
    }

    return (
        <s-page heading="Website Preview">
            {!showIframe ? (
                <s-button variant="primary" onClick={handleLoadAccount}>
                    Load Your Account
                </s-button>
            ) : (
                <iframe
                    src={iframeUrl}
                    title="Website Preview"
                    style={{
                        width: "100%",
                        height: "650px",
                        border: "none",
                        borderRadius: "8px",
                    }}
                />
            )}
        </s-page>
    );
}