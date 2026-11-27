# Contributing

## Before opening a pull request

- Keep each pull request focused on one change.
- Explain the reason for the change and its expected impact.
- Do not commit passwords, API keys, access tokens, private keys, local environment files, or personal credentials.
- Do not add deployment credentials or broaden workflow permissions without a clear requirement.
- Never use `pull_request_target` to execute code from an untrusted pull request.

## Admission information

- Prefer the university, admission authority, or other responsible organization's original notice.
- Include the exact source URL and publication date for every proposed admission-data change.
- Do not present media reports, social posts, predictions, or unverified claims as official confirmation.
- Mark conflicting, incomplete, or not-yet-official information as pending verification.
- Preserve the distinction between application dates, fee-payment deadlines, and admission-test dates.
- Do not silently overwrite a previously published date; explain the correction and cite the newer or more authoritative source.

## Validation

- Run the repository checks before opening a pull request.
- Keep JSON files valid JSON (not JSONC or JavaScript object syntax).
- Review the complete diff for unrelated changes and accidental secrets.

## Reporting security issues

Do not open a public issue for a suspected vulnerability. Follow the private reporting instructions in [SECURITY.md](SECURITY.md).
