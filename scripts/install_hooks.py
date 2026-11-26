#!/usr/bin/env python3
"""
Install Git Hooks
-----------------
Installs a pre-commit hook that runs scripts/security_guard.py
before every commit to prevent malware, leaks, and vulnerabilities.
"""

import os
import stat
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
HOOKS_DIR = ROOT_DIR / ".git" / "hooks"
PRE_COMMIT_HOOK = HOOKS_DIR / "pre-commit"

HOOK_CONTENT = """#!/bin/sh
# Security & Integrity Pre-commit Guard
python scripts/security_guard.py
RESULT=$?

if [ $RESULT -ne 0 ]; then
    echo "Commit rejected: Security check failed. Run 'python scripts/security_guard.py' for details."
    exit 1
fi
exit 0
"""


def install_hook():
    if not HOOKS_DIR.exists():
        print(f"Git hooks directory not found at {HOOKS_DIR}")
        return False

    PRE_COMMIT_HOOK.write_text(HOOK_CONTENT, encoding="utf-8")
    # Set executable permissions
    try:
        current_perms = PRE_COMMIT_HOOK.stat().st_mode
        PRE_COMMIT_HOOK.chmod(current_perms | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    except Exception:
        pass

    print(f"Pre-commit security hook installed at: {PRE_COMMIT_HOOK}")
    return True


if __name__ == "__main__":
    install_hook()
