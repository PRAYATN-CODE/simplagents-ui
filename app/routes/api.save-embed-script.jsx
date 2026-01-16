import { authenticate } from "../shopify.server";

export async function action({ request }) {
    const { admin } = await authenticate.admin(request);
    const { script } = await request.json();

    if (!script) {
        return Response.json(
            { success: false, message: "Script is required" },
            { status: 400 }
        );
    }

    console.log("Received script:", script, admin);

    /* 1️⃣ Get App Installation ID */
    const installationRes = await admin.graphql(`
    query {
      currentAppInstallation {
        id
      }
    }
  `);

    const installationData = await installationRes.json();
    const appInstallationId =
        installationData?.data?.currentAppInstallation?.id;

    if (!appInstallationId) {
        return Response.json(
            { success: false, message: "App installation not found" },
            { status: 400 }
        );
    }

    /* 2️⃣ Save metafield on AppInstallation */
    const mutation = `
    mutation SaveEmbedScript($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { message }
      }
    }
  `;

    const result = await admin.graphql(mutation, {
        variables: {
            metafields: [
                {
                    namespace: "simplagents",
                    key: "embed_script",
                    type: "multi_line_text_field",
                    value: script,
                    ownerId: appInstallationId
                }
            ]
        }
    });

    const response = await result.json();
    const errors = response?.data?.metafieldsSet?.userErrors || [];

    if (errors.length > 0) {
        return Response.json(
            { success: false, message: errors[0].message },
            { status: 400 }
        );
    }

    return Response.json({
        success: true,
        message: "SimplAgents script embedded successfully"
    });
}
