import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(`
    query {
      shop {
        metafield(namespace: "shambho", key: "chat_id") {
          value
        }
      }
    }
  `);

    const json = await response.json();

    return Response.json({
        accountId: json.data.shop.metafield?.value || null,
    });
};
