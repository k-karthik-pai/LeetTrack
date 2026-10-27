# Auto Git Synchronization Rule

After completing any task, file modification, bug fix, or feature request:
1. Automatically stage all modified and new project files (`git add .`).
2. Create a clear, descriptive Git commit following standard conventional commit conventions.
3. Automatically push the commit to the remote repository (`git push origin main` or current tracking branch).
4. Do not commit sensitive environment files like `.env` (which are ignored in `.gitignore`).
