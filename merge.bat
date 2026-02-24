@echo off
echo Merging feature branch to main...
git checkout main
git pull origin main
git merge feature/react-migration -m "Merge branch 'feature/react-migration' into main"
git push origin main
git checkout feature/react-migration
echo Merge and push to main complete!
