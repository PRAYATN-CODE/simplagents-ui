import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
    try {
        const { session, admin } = await authenticate.admin(request);

        if (!session) {
            return Response.json(
                { success: false, message: "No Shopify session found" },
                { status: 401 }
            );
        }

        // 🔥 FETCH SHOP DETAILS (CORRECT WAY)
        const shopRes = await admin.graphql(`
      query {
        shop {
          name
          email
        }
      }
    `);

        const shopJson = await shopRes.json();
        const shop = shopJson.data.shop;

        const payload = {
            email: shop.email,
            shopName: shop.name,
            shopDomain: session.shop,
            accessToken: session.accessToken,
            isOnline: session.isOnline,
            scope: session.scope,
            state: session.state || null,
        };

        const res = await fetch("http://localhost:3001/api/shopify/callback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-app-secret": process.env.APP_SECRET_KEY,
            },
            body: JSON.stringify(payload),
        });

        const raw = await res.text();
        console.log("INIT ACCOUNT RAW RESPONSE:", raw);

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return Response.json(
                {
                    success: false,
                    message: "Callback API returned non-JSON",
                },
                { status: 500 }
            );
        }

        return Response.json({ success: true, data });

    } catch (err) {
        console.error("INIT ACCOUNT ERROR:", err);

        return Response.json(
            { success: false, message: err.message },
            { status: 500 }
        );
    }
};
