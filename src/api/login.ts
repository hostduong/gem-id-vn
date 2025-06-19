{% set title = "Đăng nhập | UnlimitMail - Hệ thống Email Tự Động" %}
{% set description = "UnlimitMail cung cấp hệ thống đăng nhập email tự động, bảo mật cao, hỗ trợ tốt cho các ứng dụng MMO và doanh nghiệp." %}
{% set keywords = "unlimitmail, đăng nhập email, hệ thống email tự động, mail cho MMO" %}
{% set canonical = "https://gem.id.vn/login" %}

{% include "head.njk" %}

<body class="bg-light min-h-screen flex items-center justify-center py-10">
  <div class="w-full max-w-md bg-white rounded-lg shadow-md px-6 py-8">
    <div class="flex flex-col items-center mb-6">
      <img src="/assets/logo.svg" class="h-10 mb-2" alt="GEM.ID Logo">
      <h1 class="text-xl font-semibold text-gray-800">Đăng nhập tài khoản</h1>
    </div>

    <form id="form-login" class="space-y-5" onsubmit="return checkForm();">
      <div>
        <label for="uid" class="block text-sm font-medium text-gray-700">Email hoặc Tên đăng nhập</label>
        <input id="uid" name="uid" type="text" autocomplete="username" required
               class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
      </div>

      <div>
        <label for="pass" class="block text-sm font-medium text-gray-700">Mật khẩu</label>
        <div class="relative">
          <input id="pass" name="pass" type="password" autocomplete="current-password" required
                 class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
          <button type="button" id="toggle-pass" class="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">Hiện</button>
        </div>
      </div>

      <input type="hidden" name="token" id="token" value="">

      <div class="flex items-center justify-between">
        <label class="flex items-center">
          <input id="remember" name="remember" type="checkbox"
                 class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
          <span class="ml-2 text-sm text-gray-700">Ghi nhớ đăng nhập</span>
        </label>
        <a href="/forgot-password" class="text-sm text-blue-600 hover:underline">Quên mật khẩu?</a>
      </div>

      <button type="submit"
              class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        Đăng nhập
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-600">
      Chưa có tài khoản? <a href="/register" class="text-blue-600 hover:underline">Đăng ký ngay</a>
    </p>
  </div>

  <script>
    document.getElementById("toggle-pass").addEventListener("click", () => {
      const input = document.getElementById("pass");
      input.type = input.type === "password" ? "text" : "password";
    });

    async function sha256(msg) {
      const data = new TextEncoder().encode(msg);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    }

    async function generateTempToken() {
      const hour = new Date().getUTCHours();
      return await sha256("abc123" + hour);
    }

    async function checkForm() {
      const token = await generateTempToken();
      if (!token) return false;
      document.querySelector("input[name=token]").value = token;
      return true;
    }
  </script>
</body>

{% include "footer.njk" %}
