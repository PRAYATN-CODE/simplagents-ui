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
        <s-page heading="Website Preview" fullWidth>
            {/* BEFORE LOAD */}
            {!showIframe && (
                <s-section>
                    <s-stack
                        direction="block"
                        gap="base"
                        align="center"
                        inlineAlignment="center"
                    >
                        <s-text tone="subdued">
                            Load your SimplAgents dashboard inside Shopify
                        </s-text>

                        <s-button
                            variant="primary"
                            onClick={handleLoadAccount}
                        >
                            Load Your Account
                        </s-button>
                    </s-stack>
                </s-section>
            )}

            {/* AFTER LOAD */}
            {showIframe && (
                <>
                    {/* TOP BAR */}
                    <s-section>
                        <s-stack direction="inline" align="space-between">
                            <s-button
                                variant="secondary"
                                onClick={handleLoadAccount}
                            >
                                Refresh Data
                            </s-button>
                        </s-stack>
                    </s-section>

                    {/* IFRAME */}
                    <s-section>
                        <s-box
                            borderWidth="base"
                            borderRadius="large"
                            overflow="hidden"
                            style={{ height: "calc(100vh - 140px)" }}
                        >
                            <iframe
                                src={iframeUrl}
                                title="Website Preview"
                                style={{
                                    width: "100%",
                                    height: "700px",
                                    border: "none",
                                }}
                            />
                        </s-box>
                    </s-section>
                </>
            )}
        </s-page>

    );
}