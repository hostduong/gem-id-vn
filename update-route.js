8s
Run node update-route.js
✅ Đã cập nhật route: OWJB9XobEamEyAplyl0HcQ
Author identity unknown

*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

to set your account's default identity.
Omit --global to set the identity only in this repository.

fatal: empty ident name (for <runner@fv-az1075-853.q1rngnngb1ye5ngoly4epqhwef.cx.internal.cloudapp.net>) not allowed
⚠️ Không thể git commit (có thể không thay đổi gì)
npm warn exec The following package was not found and will be installed: wrangler@4.20.0

 ⛅️ wrangler 4.20.0
───────────────────

✘ [ERROR] The entry-point file at "src/api/OWJB9XobEamEyAplyl0HcQ.ts" was not found.



Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
🪵  Logs were written to "/home/runner/.config/.wrangler/logs/wrangler-2025-06-17_13-41-46_532.log"
node:internal/errors:984
  const err = new Error(message);
              ^

Error: Command failed: npx wrangler deploy
    at genericNodeError (node:internal/errors:984:15)
    at wrappedFn (node:internal/errors:538:14)
    at checkExecSyncError (node:child_process:891:11)
    at execSync (node:child_process:963:15)
    at /home/runner/work/gem-id-vn/gem-id-vn/update-route.js:39:3
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5) {
  status: 1,
  signal: null,
  output: [ null, null, null ],
  pid: 2023,
  stdout: null,
  stderr: null
}

Node.js v20.19.2
Error: Process completed with exit code 1.
