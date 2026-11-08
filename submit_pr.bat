@echo off
echo ===================================================
echo GabinoTech OS - Submit Bounty PR for Issue #18
echo Destination Payout: gabinotech22@gmail.com
echo ===================================================
git push origin fix/bounty-issue-2465
gh pr create --title "[Bug bounty] Type-and-then transfers add the recipient existential deposit twice when paying fees in a custom asset" --body-file PR_CLAIM_BUNDLE.md
echo [OK] Pull Request submitted. Check https://github.com/paraspell/xcm-tools/issues/2465
pause
