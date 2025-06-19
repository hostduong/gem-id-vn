document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const uid = document.getElementById("uid").value.trim();
  const pass = document.getElementById("pass").value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: uid, password: pass })
    });

    const data = await res.json();

    if (res.ok) {
      document.cookie = `token=${data.cookie}; Path=/; Max-Age=604800`;
      window.location.href = "/"; // hoặc /dashboard
    } else {
      alert(data.message || "Đăng nhập thất bại!");
    }
  } catch (err) {
    alert("Không thể kết nối máy chủ.");
  }
});
