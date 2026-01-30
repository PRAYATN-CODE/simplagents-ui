import crypto from "crypto";

export const action = async ({ request }) => {
    const rawBody = await request.text();
    const hmac = request.headers.get("x-shopify-hmac-sha256");

    if (!hmac) {
        return new Response("Missing HMAC", { status: 401 });
    }

    const generatedHmac = crypto
        .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
        .update(rawBody, "utf8")
        .digest("base64");

    if (generatedHmac !== hmac) {
        return new Response("Invalid HMAC", { status: 401 });
    }

    // ✅ Parse webhook payload
    const payload = JSON.parse(rawBody);
    const topic = request.headers.get("x-shopify-topic");

    console.log("Compliance webhook received:", topic, payload);

    switch (topic) {
        case "customers/data_request":
            // You can log or prepare data export
            break;

        case "customers/redact":
            // Delete customer-related data if stored
            break;

        case "shop/redact":
            // 🔥 IMPORTANT: delete all shop-related data
            // ex: accounts, agents, tokens, configs
            break;
    }

    // ✅ MUST respond 200
    return new Response("OK", { status: 200 });
};
