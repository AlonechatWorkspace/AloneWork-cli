import { marked, type Tokens } from "marked"

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

const renderer = new marked.Renderer()

renderer.link = ({ href, title, text }: Tokens.Link) => {
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : ""
  return `<a href="${escapeAttr(href)}"${titleAttr} class="external-link" target="_blank" rel="noopener noreferrer">${text}</a>`
}

export function parseMarkdown(input: string) {
  return marked(input, {
    renderer,
    breaks: false,
    gfm: true,
  })
}
