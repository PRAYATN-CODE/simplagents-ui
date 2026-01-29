import { useAppBridge } from "@shopify/app-bridge-react";
import { createContext, useContext, useState } from "react";

const ShambhoContext = createContext(null);

export const ShambhoProvider = ({ children }) => {
  const shopify = useAppBridge();

  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [shambhoAccessToken, setShambhoAccessToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 🔥 MAIN INIT CALL
  const initializeAccount = async () => {

    setLoading(true);
    try {
      const res = await fetch("/api/init-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error("Initialization failed");
      }

      const agentsData = result.data.data;

      setAgents(agentsData);
      // setActiveAgent(agentsData[0] || null);
      setAccountId(agentsData[0]?.accountId || null);
      setShambhoAccessToken(result.data.shambhoAccessToken);
      setInitialized(true);
    } catch (err) {
      shopify.toast.show(err.message, { isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShambhoContext.Provider
      value={{
        agents,
        activeAgent,
        accountId,
        shambhoAccessToken,
        loading,
        initializeAccount,
        setActiveAgent,
      }}
    >
      {children}
    </ShambhoContext.Provider>
  );
};

export const useShambho = () => useContext(ShambhoContext);
