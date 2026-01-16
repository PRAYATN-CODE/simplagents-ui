let isScriptLoaded = false;
let isScriptLoading = false;

export function loadShambhoChat(settings) {
    // Already loaded → just render
    if (isScriptLoaded && window.renderChatModal) {
        window.renderChatModal();
        return;
    }

    // Set settings BEFORE script loads
    window.chatModalSettings = settings;

    if (isScriptLoading) return;
    isScriptLoading = true;

    const script = document.createElement("script");
    script.src = "https://chat.shambho.ai/embeded-script.js";
    script.async = true;

    script.onload = () => {
        isScriptLoaded = true;
        isScriptLoading = false;

        // ✅ THIS is the correct entry point
        if (window.renderChatModal) {
            window.renderChatModal();
        } else {
            console.error("❌ renderChatModal not found on window");
        }
    };

    script.onerror = () => {
        isScriptLoading = false;
        console.error("❌ Failed to load Shambho chat script");
    };

    document.body.appendChild(script);
}
