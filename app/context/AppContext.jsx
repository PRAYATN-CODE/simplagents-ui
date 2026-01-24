import { useAppBridge } from "@shopify/app-bridge-react";
import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const shopify = useAppBridge();

    const [agents, setAgents] = useState([]);
    const [activeAgent, setActiveAgent] = useState(null);
    const [accountId, setAccountId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch agents from Shopify backend
    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/shambho-agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to load agents");
            }

            console.log(data)

            setAgents(data.data);

            // Optional: auto-select first agent
            if (data.data.length > 0) {
                setActiveAgent(data.data[0]);
                setAccountId(data.data[0].accountId);
            }
        } catch (err) {
            shopify.toast.show(err.message, { isError: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContext.Provider
            value={{
                agents,
                activeAgent,
                accountId,
                loading,
                setActiveAgent,
                setAccountId,
                fetchAgents,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
