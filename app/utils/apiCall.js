import { http } from "./http.client";

export const cloneAgent = ({ agentId, email, mcps }) => {
    return http.post(
        "/api/clone-agent",
        { email, mcps },
        {
            params: { agentId },
            toastConfig: {
                loadingMessage: "Creating Shambho AI App",
                finalMessage: "App created successfully",
            },
        }
    );
};
