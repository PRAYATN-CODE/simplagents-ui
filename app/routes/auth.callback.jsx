import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    // 🔐 SERVER → SERVER call (safe)
    await fetch("https://api.shambho.ai/api/shopify/auth/callback", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-app-secret": "shamboo_faq_shopify_secret_key_12345",
        },
        body: JSON.stringify({
            shop: session.shop,
            accessToken: session.accessToken,
            isOnline: session.isOnline,
        }),
    });

    return redirect("/");
};
