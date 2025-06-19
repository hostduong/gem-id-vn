// ✅ api.js hoặc api.ts
export async function callAPI(type, data = {}) {
  const routeUrl = localStorage.getItem("route");
  const cookie = localStorage.getItem("cookie");

  const payload = { type, cookie, ...data };

  try {
    const res = await fetch(routeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 404 || text.includes("route expired")) {
        localStorage.setItem("retry_payload", JSON.stringify(payload));
        location.reload(); // 🔁 Tự reload để lấy lại route + thực hiện lại
        return;
      }
      throw new Error(`API lỗi: ${text}`);
    }

    return await res.json();
  } catch (err) {
    console.error("❌ API Exception:", err);
    throw err;
  }
}
