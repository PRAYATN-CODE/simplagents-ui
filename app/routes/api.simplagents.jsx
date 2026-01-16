import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    const shopDomain = session.shop;

    const response = await fetch("https://api.shambho.ai/api/shopify/get-shambho-token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-app-secret": "shamboo_faq_shopify_secret_key_12345"
        },
        body: JSON.stringify({
            shopDomain,
            secret: "shamboo_faq_shopify_secret_key_12345"
        })
    });

    const raw = await response.text();   // 👈 IMPORTANT
    console.log("Shambho raw response:", raw);

    try {
        const data = JSON.parse(raw);
        return Response.json(data);
    } catch (e) {
        return new Response(raw, { status: 500 });
    }
};
