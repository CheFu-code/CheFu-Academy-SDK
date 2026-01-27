# Security Policy

## Supported Versions

The following versions of this project are currently supported with security updates:

| Version | Supported |
| ------- | --------- |
| Latest  | ✅ Yes    |
| Older   | ❌ No     |

Only the **latest released version** of this repository receives security fixes.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public GitHub issue**.

Instead, report it responsibly using one of the methods below:

- 🔒 **GitHub Security Advisories only** (recommended)

Please use the **"Report a vulnerability"** feature in the GitHub repository to submit a private security advisory.

When reporting, please include:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any relevant logs, screenshots, or proof-of-concept code

We aim to acknowledge reports within **48 hours** and will work to resolve valid issues as quickly as possible.

---

## Security Scope

This repository contains a **client-side SDK** for interacting with the CheFu Academy API.

### In scope

- Authentication handling logic in the SDK
- API request construction
- Error handling and data validation

### Out of scope

- Backend infrastructure or server-side vulnerabilities
- Third-party services used by the API
- Issues caused by improper usage of the SDK

---

## Best Practices for Users

To help keep your applications secure:

- Never commit API keys or secrets to your repositories
- Store sensitive values in environment variables
- Always validate and sanitize user input on the server
- Keep dependencies up to date

---

## Disclosure Policy

Security issues are handled with **responsible disclosure** in mind.

- Vulnerabilities will be fixed before public disclosure
- Credit will be given to reporters unless anonymity is requested

Thank you for helping keep CheFu Academy and its community secure 🙏
