# 安全审计报告 — OpenCode 全量静态扫描

**审计日期**: 2026-05-31  
**审计范围**: `e:\alonework` 全仓库  
**审计方法**: 基于 OWASP、React Security Spec、General JS/TS Security Spec 的静态代码分析  
**扫描语言**: TypeScript / JavaScript (Bun runtime, SolidJS/React, Electron)

---

## 执行摘要

对 OpenCode 代码库进行了全量静态安全扫描，涵盖认证授权、注入漏洞、路径遍历、XSS、命令注入、凭据管理、CORS 配置等安全领域。

**发现统计**:
- **严重 (Critical)**: 2 个
- **高 (High)**: 5 个
- **中 (Medium)**: 8 个
- **低 (Low)**: 7 个
- **信息 (Informational)**: 3 个

**总体评估**: 代码库整体安全意识较好（使用了 Effect 框架的类型安全、DOMPurify 消毒、权限系统等），但在路径遍历防护、密码比较时序安全、桌面端 XSS 防护等方面存在需要修复的漏洞。

---

## 严重 (Critical) 发现

### SEC-001: 路径遍历 — 符号链接绕过文件系统边界检查

**影响**: 攻击者可通过构造符号链接路径，使 AI 代理读取或写入项目目录外的任意文件（如 `/etc/passwd`、`~/.ssh/id_rsa`）。

**位置**: [filesystem.ts:244-246](file:///e:/alonework/packages/core/src/filesystem.ts#L244-L246)

```typescript
export function contains(parent: string, child: string) {
  return !relative(parent, child).startsWith("..")
}
```

**问题**: `contains` 函数是所有文件工具路径边界检查的基础，仅执行字符串级别的 `path.relative()` 比较，不解析符号链接。在 macOS/Linux 上，[normalizePath](file:///e:/alonework/packages/core/src/filesystem.ts#L200-L208) 完全是空操作：

```typescript
export function normalizePath(p: string): string {
  if (process.platform !== "win32") return p  // macOS/Linux 直接返回原路径
}
```

**影响范围**: 所有文件工具（Read、Write、Edit、ApplyPatch、Glob、Grep）都依赖此函数进行路径安全检查。

**关联文件**:
- [external-directory.ts:16-45](file:///e:/alonework/packages/opencode/src/tool/external-directory.ts#L16-L45) — `assertExternalDirectoryEffect` 的 `bypass` 可跳过检查
- [read.ts:73-87](file:///e:/alonework/packages/opencode/src/tool/read.ts#L73-L87) — 目录列表中符号链接被 `fs.stat` 跟踪
- [write.ts:41-44](file:///e:/alonework/packages/opencode/src/tool/write.ts#L41-L44) — 写入路径不规范化
- [edit.ts:80-83](file:///e:/alonework/packages/opencode/src/tool/edit.ts#L80-L83) — 编辑路径不规范化
- [apply_patch.ts:73-74](file:///e:/alonework/packages/opencode/src/tool/apply_patch.ts#L73-L74) — 补丁路径来自用户输入
- [git/index.ts:14](file:///e:/alonework/packages/opencode/src/git/index.ts#L14) — Git 启用 `core.symlinks=true`

**修复建议**: 在 `contains` 函数中使用 `realpathSync` 解析符号链接后再进行比较，或在所有文件操作前对路径进行规范化。

---

### SEC-002: Desktop 端 Shell 注入 — `wslPath()` 命令注入

**影响**: 如果 Electron 渲染进程被攻陷，攻击者可通过构造包含 `$(...)` 的路径参数实现远程代码执行。

**位置**: [apps.ts:24-41](file:///e:/alonework/packages/desktop/src/main/apps.ts#L24-L41)

```typescript
if (path.startsWith("~")) {
  const suffix = path.slice(1)
  const cmd = `wslpath ${flag} "$HOME${suffix.replace(/"/g, '\\"')}"`
  const output = execFileSync("wsl", ["-e", "sh", "-lc", cmd])
  return output.toString().trim()
}
```

**问题**: 仅转义了双引号字符，未处理 `$()`、反引号等 shell 元字符。传入 `~$(malicious_command)` 会导致命令注入，因为 shell 在双引号内仍会展开 `$(...)`。

**攻击路径**: `path` 参数来自渲染进程的 IPC 调用 ([ipc.ts:68](file:///e:/alonework/packages/desktop/src/main/ipc.ts#L68))。

**修复建议**: 使用 `execFileSync` 配合参数数组而非 shell 命令字符串拼接，或使用 `wslpath` 的参数传递方式避免 shell 解释。

---

## 高 (High) 发现

### SEC-003: 密码比较未使用常量时间函数 — 时序攻击

**影响**: 攻击者可通过测量响应时间逐字符推断服务器密码。

**位置**: [auth.ts:28-34](file:///e:/alonework/packages/opencode/src/server/auth.ts#L28-L34)

```typescript
export function authorized(credentials: DecodedCredentials, config: Info) {
  return (
    Option.isSome(config.password) &&
    credentials.username === config.username &&
    Redacted.value(credentials.password) === config.password.value  // ← 非常量时间比较
  )
}
```

**对比**: 同一代码库中的 [crypto.ts](file:///e:/alonework/packages/console/core/src/util/crypto.ts#L1-L7) 已正确实现了 `timingSafeEqual`：

```typescript
export function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  return aBytes.length === bBytes.length && timingSafeEqual(aBytes, bBytes)
}
```

**修复建议**: 将 `===` 替换为 `timingSafeEqual` 比较，复用已有的 `safeEqual` 实现。

---

### SEC-004: Web Share 页面 Markdown 渲染未消毒 — XSS

**影响**: 公共分享页面可被注入恶意 HTML/JavaScript，影响所有查看分享链接的用户。

**位置**: [content-markdown.tsx:53](file:///e:/alonework/packages/web/src/components/share/content-markdown.tsx#L53)

```tsx
<div data-slot="markdown" ref={overflow.ref} innerHTML={html()} />
```

**问题**: `marked` 解析后直接注入 `innerHTML`，无 DOMPurify 消毒。自定义 `link` renderer 中手动拼接 `href` 和 `title` 属性存在属性注入风险。

**对比**: 主应用的 [markdown.tsx](file:///e:/alonework/packages/ui/src/components/markdown.tsx) 已正确使用 DOMPurify 消毒。

**修复建议**: 为 web share 页面添加 DOMPurify 消毒，与主应用保持一致。同时审查自定义 `link` renderer 中的属性拼接。

---

### SEC-005: Desktop 端 Markdown 渲染未消毒 — XSS 可导致 RCE

**影响**: Electron 桌面端中 XSS 可升级为远程代码执行（RCE），因为渲染进程可通过 IPC 调用主进程的 `exec` 功能。

**位置**: [markdown.ts:1-16](file:///e:/alonework/packages/desktop/src/main/markdown.ts#L1-L16)

```typescript
import { marked, type Tokens } from "marked"
const renderer = new marked.Renderer()
renderer.link = ({ href, title, text }: Tokens.Link) => {
  const titleAttr = title ? ` title="${title}"` : ""
  return `<a href="${href}"${titleAttr} class="external-link" target="_blank" rel="noopener noreferrer">${text}</a>`
}
export function parseMarkdown(input: string) {
  return marked(input, { renderer, breaks: false, gfm: true })
}
```

**问题**: 无 DOMPurify 消毒，自定义 link renderer 手动拼接 `href` 和 `title` 属性。

**修复建议**: 添加 DOMPurify 消毒层，特别关注 Electron 环境中 XSS → RCE 的升级风险。

---

### SEC-006: Desktop 端 `open-path` IPC 允许执行任意可执行文件

**影响**: 被攻陷的渲染进程可在主进程中执行系统上的任意二进制文件。

**位置**: [ipc.ts:155-162](file:///e:/alonework/packages/desktop/src/main/ipc.ts#L155-L162)

```typescript
ipcMain.handle("open-path", async (_event, path: string, app?: string) => {
  if (!app) return shell.openPath(path)
  await new Promise<void>((resolve, reject) => {
    const [cmd, args] =
      process.platform === "darwin" ? (["open", ["-a", app, path]] as const) : ([app, [path]] as const)
    execFile(cmd, args, (err) => (err ? reject(err) : resolve()))
  })
})
```

**问题**: 在非 macOS 平台上，`app` 参数直接作为可执行文件路径传给 `execFile`，无白名单验证。

**修复建议**: 添加可执行文件白名单验证，或限制 `app` 参数只能是已注册的应用路径。

---

### SEC-007: HTTP API 允许通过参数设置任意工作目录

**影响**: 如果服务器认证配置不当，攻击者可设置任意目录为工作目录，读取系统上的敏感文件。

**位置**: [workspace-routing.ts:86-88](file:///e:/alonework/packages/opencode/src/server/routes/instance/httpapi/middleware/workspace-routing.ts#L86-L88)

```typescript
function defaultDirectory(request, url: URL): string {
  return url.searchParams.get("directory") || request.headers["x-opencode-directory"] || process.cwd()
}
```

**缓解**: 有 Authorization 中间件保护，但依赖认证配置的正确性。

**修复建议**: 对 `directory` 参数进行路径白名单验证，确保指向合法的项目目录。

---

## 中 (Medium) 发现

### SEC-008: `new Function()` 代码执行 — 调试命令参数解析

**位置**: [agent.ts:123](file:///e:/alonework/packages/opencode/src/cli/cmd/debug/agent.ts#L123)

```typescript
return new Function(`return (${trimmed})`)()
```

**问题**: 作为 JSON.parse 失败后的回退，使用 `new Function` 执行用户输入。虽然仅在调试命令中使用，但仍存在代码注入风险。

**修复建议**: 移除 `new Function` 回退，仅使用 `JSON.parse`。

---

### SEC-009: OAuth 令牌以明文 JSON 存储在磁盘

**位置**:
- [mcp/auth.ts:36-37](file:///e:/alonework/packages/opencode/src/mcp/auth.ts#L36-L37) — `mcp-auth.json`
- [auth/index.ts:9](file:///e:/alonework/packages/opencode/src/auth/index.ts#L9) — `auth.json`
- [account.ts:127-128](file:///e:/alonework/packages/core/src/account.ts#L127-L128) — `account.json`
- [account.sql.ts:10-11](file:///e:/alonework/packages/opencode/src/account/account.sql.ts#L10-L11) — SQLite 数据库

**问题**: OAuth token、API key、refresh_token 均以明文存储。文件权限设为 `0o600`，但 Windows 上文件权限控制不如 Unix 严格。

**修复建议**: 考虑对敏感凭据增加加密机制（如使用系统密钥链）。

---

### SEC-010: Console Session Cookie `secure: false`

**位置**: [auth.ts:29-38](file:///e:/alonework/packages/console/app/src/context/auth.ts#L29-L38)

```typescript
cookie: {
  secure: false,  // ← HTTP 连接中也会传输 cookie
  httpOnly: true,
},
maxAge: 60 * 60 * 24 * 365,  // ← 一年有效期过长
```

**问题**: `secure: false` 意味着 cookie 在 HTTP 连接中传输，存在会话劫持风险。缺少 `sameSite` 属性设置。

**修复建议**: 生产环境中设置 `secure: true`，添加 `sameSite: "lax"`，缩短 `maxAge`。

---

### SEC-011: 服务器密码默认未设置

**位置**: [serve.ts:15-17](file:///e:/alonework/packages/opencode/src/cli/cmd/serve.ts#L15-L17)

```typescript
if (!Flag.OPENCODE_SERVER_PASSWORD) {
  console.log("Warning: OPENCODE_SERVER_PASSWORD is not set; server is unsecured.")
}
```

**问题**: 仅输出警告不强制设置密码，用户可能在不知情的情况下运行无认证服务器。

**修复建议**: 考虑在非 localhost 绑定时强制要求密码。

---

### SEC-012: URL 查询参数传递认证凭据

**位置**: [authorization.ts:81-87](file:///e:/alonework/packages/opencode/src/server/routes/instance/httpapi/middleware/authorization.ts#L81-L87)

**问题**: 允许通过 URL 查询参数 `auth_token` 传递认证凭据。URL 中的凭据会出现在服务器日志、浏览器历史、代理日志和 Referer 头中。

**修复建议**: 限制 URL 参数认证仅用于 WebSocket 等无法设置 Header 的场景，并添加文档警告。

---

### SEC-013: CORS 允许所有 localhost 端口

**位置**: [cors.ts:11-19](file:///e:/alonework/packages/opencode/src/server/cors.ts#L11-L19)

```typescript
if (!input) return true  // ← 缺少 Origin 头的请求也被放行
if (input.startsWith("http://localhost:")) return true
if (input.startsWith("http://127.0.0.1:")) return true
```

**问题**: 允许任何 localhost 端口的来源，同机器上的恶意网页可访问 API。缺少 Origin 头的请求也被放行。

**修复建议**: 记录 `undefined` Origin 的放行原因，考虑对 localhost 来源添加端口白名单。

---

### SEC-014: `connect-src *` CSP 过于宽松

**位置**: [ui.ts](file:///e:/alonework/packages/opencode/src/server/shared/ui.ts)

```typescript
export const csp = (hash = "") =>
  `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'${hash}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' data:; connect-src * data:`
```

**问题**: `connect-src * data:` 允许向任意域名发起请求，可能被用于数据外泄。缺少 `frame-ancestors` 指令。

**修复建议**: 收紧 `connect-src` 为已知 API 域名白名单，添加 `frame-ancestors` 指令。

---

### SEC-015: 权限审批持久化后不受会话约束

**位置**: [permission/index.ts:247-253](file:///e:/alonework/packages/opencode/src/permission/index.ts#L247-L253)

**问题**: 用户选择 "always" 后，权限规则被持久化到数据库，在后续所有会话中持续有效。如果用户对 bash 执行选择了 "always allow"，后续会话中的 AI 代理可无需确认直接执行。

**修复建议**: 考虑对高风险权限添加有效期限制或会话级约束。

---

## 低 (Low) 发现

### SEC-016: `eval` 在 Shell 参数构建中使用

**位置**: [shell.ts:159-193](file:///e:/alonework/packages/opencode/src/shell/shell.ts#L159-L193)

```typescript
eval ${JSON.stringify(command)}
```

**问题**: 虽然 `JSON.stringify` 提供了基本保护，但 `eval` 在 shell 环境中本身是危险操作。

---

### SEC-017: Desktop 端 `open-link` 缺乏 URL 协议验证

**位置**: [ipc.ts:151-153](file:///e:/alonework/packages/desktop/src/main/ipc.ts#L151-L153)

```typescript
ipcMain.on("open-link", (_event, url: string) => {
  void shell.openExternal(url)
})
```

**问题**: 无协议验证，恶意 URL（如 `file://`）可能被用于触发本地应用。

---

### SEC-018: `Math.random()` 用于 ID 生成

**位置**:
- [id.ts:89](file:///e:/alonework/packages/app/src/utils/id.ts#L89) — `Math.floor(Math.random() * 256)`
- [uuid.ts:1](file:///e:/alonework/packages/app/src/utils/uuid.ts#L1) — `Math.random().toString(16).slice(2)` (fallback)
- 多处 Console 路由中用于生成 tool/message ID

**问题**: `Math.random()` 不是密码学安全的随机数生成器。用于 ID 生成时可能被预测。

**修复建议**: 对安全敏感的 ID 使用 `crypto.randomUUID()` 或 `crypto.getRandomValues()`。

---

### SEC-019: PTY 连接 Ticket 绕过 Basic Auth

**位置**: [authorization.ts:147](file:///e:/alonework/packages/opencode/src/server/routes/instance/httpapi/middleware/authorization.ts#L147)

**问题**: PTY 连接路径在有 ticket 参数时完全绕过 Basic Auth。ticket 在 URL 查询字符串中传递。

---

### SEC-020: SSR Diff 模板注入风险

**位置**: [file-ssr.tsx:185](file:///e:/alonework/packages/ui/src/components/file-ssr.tsx#L185)

```tsx
<template shadowrootmode="open" innerHTML={local.preloadedDiff.prerenderedHTML} />
```

**问题**: `prerenderedHTML` 来自 SSR 库的 diff 渲染，Shadow DOM 提供了一定隔离但仍需确保正确转义。

---

### SEC-021: OAuth State 参数记录到日志

**位置**: [oauth-callback.ts:124](file:///e:/alonework/packages/opencode/src/mcp/oauth-callback.ts#L124)

```typescript
log.error("oauth callback with invalid state", { state, pendingStates: Array.from(pendingAuths.keys()) })
```

**问题**: 将所有 pending states 记录到日志，可能泄露 OAuth state 参数。

---

### SEC-022: Provider info 可能泄露 API key

**位置**: [provider.ts:1595](file:///e:/alonework/packages/opencode/src/provider/provider.ts#L1595)

**问题**: `toPublicInfo` 序列化时，`apiKey` 字段作为普通字符串会被保留在结果中。如果传递到前端或日志，可能暴露 API key。

---

## 信息 (Informational) 发现

### SEC-023: MCP 从配置文件加载执行命令

**位置**: [mcp/index.ts:421-455](file:///e:/alonework/packages/opencode/src/mcp/index.ts#L421-L455)

**问题**: MCP 本地服务器命令来自用户配置文件。如果攻击者能修改配置文件，可执行任意命令。

---

### SEC-024: 环境变量传递完整认证内容

**位置**: [workspace.ts:569-570](file:///e:/alonework/packages/opencode/src/control-plane/workspace.ts#L569-L570)

**问题**: 所有认证凭据通过环境变量 `OPENCODE_AUTH_CONTENT` 传递给子进程。环境变量可通过 `/proc/<pid>/environ` 被同用户进程读取。

---

### SEC-025: `Access-Control-Allow-Origin: *` 在多个端点使用

**位置**:
- [changelog.json.ts:4](file:///e:/alonework/packages/console/app/src/routes/changelog.json.ts#L4)
- [modelsHandler.ts:5](file:///e:/alonework/packages/console/app/src/routes/zen/util/modelsHandler.ts#L5)
- [windows.ts:163](file:///e:/alonework/packages/desktop/src/main/windows.ts#L163)

**问题**: 多个端点使用 `Access-Control-Allow-Origin: *`，允许任意来源访问。changelog 和 models 等公开数据可接受，但 Desktop 端的通配符需评估。

---

## 安全正面实践

审计中也发现了以下良好的安全实践：

1. **OAuth State CSRF 保护** — MCP OAuth 回调正确验证 state 参数 ([oauth-callback.ts](file:///e:/alonework/packages/opencode/src/mcp/oauth-callback.ts))
2. **加密安全随机数** — Console API Key 使用 `crypto.getRandomValues` 生成 ([key.ts](file:///e:/alonework/packages/console/core/src/key.ts))
3. **timingSafeEqual** — Console 和 Stats 模块正确使用常量时间比较 ([crypto.ts](file:///e:/alonework/packages/console/core/src/util/crypto.ts))
4. **DOMPurify 消毒** — 主应用 Markdown 渲染使用 DOMPurify ([markdown.ts](file:///e:/alonework/packages/ui/src/components/markdown.ts.ts))
5. **权限系统** — 实现了 deny/allow/ask 三级策略，默认行为是 "ask" ([permission.ts](file:///e:/alonework/packages/core/src/permission.ts))
6. **子代理权限继承** — 正确转发 deny 规则 ([subagent-permissions.ts](file:///e:/alonework/packages/opencode/src/agent/subagent-permissions.ts))
7. **邮箱验证** — Console 认证正确拒绝未验证邮箱的用户
8. **XAI OAuth 错误页消毒** — 使用自定义 `escapeHtml` 并有测试覆盖 ([xai.ts](file:///e:/alonework/packages/opencode/src/plugin/xai.ts))
9. **Tree-sitter 命令解析** — Shell 工具使用 tree-sitter 解析命令进行权限检查

---

## 修复优先级建议

### 立即修复 (P0)
1. **SEC-001**: 修复 `AppFileSystem.contains` 符号链接绕过 — 影响所有文件工具
2. **SEC-003**: 密码比较使用 `timingSafeEqual`
3. **SEC-004**: Web share 页面添加 DOMPurify 消毒
4. **SEC-005**: Desktop 端 Markdown 添加 DOMPurify 消毒

### 短期修复 (P1)
5. **SEC-002**: 修复 `wslPath()` 命令注入
6. **SEC-006**: `open-path` IPC 添加白名单验证
7. **SEC-007**: HTTP API `directory` 参数添加路径验证
8. **SEC-008**: 移除 `new Function` 回退

### 中期改进 (P2)
9. **SEC-009**: 凭据存储加密
10. **SEC-010**: Console Cookie 安全配置
11. **SEC-011**: 非 localhost 绑定强制密码
12. **SEC-013/014**: 收紧 CORS 和 CSP 配置

### 长期优化 (P3)
13. **SEC-016-022**: 其他低风险发现
14. **SEC-023-025**: 信息性发现的文档和配置改进
