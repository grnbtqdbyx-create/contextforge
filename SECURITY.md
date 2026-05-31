# Security Policy

ContextForge is local-first and should not send repository contents, session
logs, secrets, or reports over the network unless a user explicitly asks for a
networked workflow.

## Reporting a Vulnerability

Please open a private security advisory on GitHub or contact the maintainer.

## Secret Handling

ContextForge must never include API keys, `.env` files, private keys, tokens, or
credentials in generated context packs or reports.

