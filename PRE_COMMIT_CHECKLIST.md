# ✅ Pre-Commit Checklist

Run this checklist before every `git push`:

## 1. Environment Files Check

```bash
# These should return the file paths (meaning they're ignored):
git check-ignore backend/.env frontend/.env

# This should return nothing (meaning .env is not staged):
git diff --cached --name-only | grep "\.env$"
```

## 2. Sensitive Data Check

Search your staged changes for sensitive patterns:

```bash
# Check for potential secrets
git diff --cached | grep -i "password\|secret\|key\|token\|uri"
```

If you find any:

- ❌ Remove hardcoded secrets
- ✅ Move to `.env` file
- ✅ Use `process.env.VARIABLE_NAME`

## 3. Verify `.env.example` is Updated

```bash
# Check if .env.example has all variables from .env
diff <(grep "^[A-Z_]" backend/.env | cut -d= -f1 | sort) <(grep "^[A-Z_]" backend/.env.example | cut -d= -f1 | sort)
```

## 4. Test Before Push

```bash
# Backend tests
cd backend
npm test  # if you have tests

# Frontend tests
cd frontend
npm test  # if you have tests
```

## 5. Review Staged Changes

```bash
# See what you're about to commit
git diff --cached

# See list of files
git status
```

## 6. Common Mistakes to Avoid

### ❌ DON'T:

- Commit `.env` files
- Hardcode `mongodb://` or `mongodb+srv://` URIs
- Put passwords in code comments
- Commit `node_modules/`
- Include personal API keys
- Commit database dumps with real data

### ✅ DO:

- Use environment variables
- Update `.env.example` when adding new vars
- Use meaningful commit messages
- Keep credentials in password manager
- Share `.env.example` in repo
- Document environment setup in README

## 7. Quick Commands

### If you staged .env by mistake:

```bash
git reset HEAD backend/.env
git reset HEAD frontend/.env
```

### If you committed .env (but not pushed):

```bash
git reset --soft HEAD~1
git reset HEAD backend/.env frontend/.env
git commit -m "Your commit message"
```

### If you already pushed .env:

```bash
# 🚨 URGENT: Change all secrets immediately!
# Then remove from git:
git rm --cached backend/.env frontend/.env
git commit -m "Remove sensitive files"
git push

# Then rotate ALL credentials:
# - MongoDB password
# - JWT secret
# - Any API keys
```

## 8. Pre-Push Command

Run this one-liner before pushing:

```bash
git check-ignore backend/.env frontend/.env && echo "✅ .env files properly ignored" || echo "❌ WARNING: .env not ignored!"
```

---

## Emergency: I Pushed Secrets!

1. **Immediately rotate ALL secrets:**

   - Change MongoDB password
   - Generate new JWT_SECRET
   - Update `.env` file

2. **Remove from git history:**

   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env frontend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push:**

   ```bash
   git push origin --force --all
   ```

4. **Inform your team** to re-clone the repository

5. **Consider the secrets compromised** - change them everywhere they're used

---

**Remember:** Prevention is easier than recovery! Take 30 seconds to check before each push. 🛡️
