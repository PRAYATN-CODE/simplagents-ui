/* eslint-disable no-console */
import toast from "react-hot-toast";

/* -------------------- */
/* Deferred helper */
/* -------------------- */
function createDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

/* -------------------- */
/* Core Fetch Wrapper */
/* -------------------- */
async function request({
    url,
    method = "GET",
    body,
    headers = {},
    params,
    signal,
    toastConfig,
    withAuth = true,
}) {
    const deferred = createDeferred();
    const baseURL = "https://api.shambho.ai" || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    /* Toast handling */
    if (toastConfig?.loadingMessage) {
        toast.promise(deferred.promise, {
            loading: `${toastConfig.loadingMessage}...`,
            success: toastConfig.finalMessage || "Success",
            error: (err) => err || "Something went wrong",
        });
    }

    /* Query params */
    const queryString = params
        ? `?${new URLSearchParams(params).toString()}`
        : "";

    /* Auth token */
    let authHeaders = {};
    if (withAuth) {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (user?.token) {
                authHeaders["auth-token"] = user.token;
            }
            localStorage.setItem("lastActivity", `${Date.now()}`);
        } catch {
            console.warn("Invalid user session");
        }
    }

    try {
        const response = await fetch(`${baseURL}${url}${queryString}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...authHeaders,
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal,
            credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        const normalizedResponse = {
            ...data,
            status: response.status,
            ok: response.ok,
            success: data.success ?? response.ok,
        };

        /* Session expired */
        if (response.status === 401) {
            deferred.reject("Session expired");
            localStorage.clear();
            setTimeout(() => {
                window.location.replace("/auth/login");
            }, 100);
            return normalizedResponse;
        }

        /* Success / Error handling */
        if (normalizedResponse.success) {
            deferred.resolve(normalizedResponse.message || "Success");
            if (toastConfig?.successDismiss) toast.dismiss();
        } else {
            deferred.reject(normalizedResponse.message || "Request failed");
        }

        return normalizedResponse;
    } catch (err) {
        console.error("Fetch Error:", err);
        deferred.reject("Network error");
        return {
            success: false,
            message: "Network error",
        };
    }
}

/* -------------------- */
/* HTTP Methods */
/* -------------------- */
export const http = {
    get: (url, options = {}) =>
        request({ url, method: "GET", ...options }),

    post: (url, body, options = {}) =>
        request({ url, method: "POST", body, ...options }),

    put: (url, body, options = {}) =>
        request({ url, method: "PUT", body, ...options }),

    delete: (url, options = {}) =>
        request({ url, method: "DELETE", ...options }),
};
