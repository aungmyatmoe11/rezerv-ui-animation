# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in this project, please report it privately rather than opening a public issue.

### How to Report

**Email:** [aungmyatmoe.dev11@gmail.com](mailto:aungmyatmoe.dev11@gmail.com)

**Subject line:** `[SECURITY] Brief description of the issue`

### What to Include

When reporting a vulnerability, please include:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### Response Timeline

- **Initial response:** Within 48 hours of report
- **Status update:** Within 7 days
- **Fix timeline:** Depends on severity and complexity

### Scope

This project is a static concept site with:
- No user accounts or authentication
- No personal data collection
- No payment processing
- No privileged operations

Security concerns are primarily:
- XSS or injection vulnerabilities
- Improper security headers
- Dependency vulnerabilities
- Build/deployment security

### Out of Scope

The following are **not** considered vulnerabilities:
- Issues only exploitable with physical access to the server
- Social engineering attacks
- Attacks requiring user to install malicious software
- Issues in third-party dependencies that have already been reported upstream

### Disclosure Policy

- Please allow us reasonable time to address the issue before public disclosure
- We will credit reporters (unless you prefer to remain anonymous)
- Once fixed, we will publish a security advisory with details

### Security Best Practices

This project follows:
- Secure headers (CSP, HSTS, X-Frame-Options, etc.)
- No inline scripts where avoidable
- Dependency scanning via npm audit
- Static analysis via ESLint
- Regular dependency updates

---

**Disclaimer:** This is an unofficial concept project. Not affiliated with Apple Inc.
