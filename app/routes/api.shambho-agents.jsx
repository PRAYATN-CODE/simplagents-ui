import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    const shopDomain = session.shop;

    const response = await fetch("https://api.shambho.ai/api/shopify/get-shambho-account-agent",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-app-secret": "shamboo_faq_shopify_secret_key_12345", // ✅ server only
            },
            body: JSON.stringify({
                shopDomain,
            }),
        }
    );

    const raw = await response.text();
    console.log("Agents raw response:", raw);

    try {
        const data = JSON.parse(raw);
        return Response.json(data);
    } catch {
        return new Response(raw, { status: 500 });
    }
};
