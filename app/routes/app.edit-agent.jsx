import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";

export default function EditAgentPage() {
    const shopify = useAppBridge();

    const [iframeUrl, setIframeUrl] = useState("");
    const [showIframe, setShowIframe] = useState(false);

    const fetchSimplAgentsToken = async () => {
        try {
            const res = await fetch("/api/simplagents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch token");
            }

            console.log("SimplAgents Token:", data);
            setIframeUrl(`https://app.simplagents.com?token=${encodeURIComponent(data.token)}`);
            setShowIframe(true);


            // You can now use this data in UI
        } catch (err) {
            console.error("SimplAgents error:", err);
        }
    };

    return (
        <s-page heading="Website Preview">
            {!showIframe ? (
                <s-button
                    variant="primary"
                    onClick={fetchSimplAgentsToken}
                >
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
        </s-page >
    );
}
