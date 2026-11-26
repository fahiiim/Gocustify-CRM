#!/usr/bin/env python3
"""
Repository Security & Integrity Guard
--------------------------------------
Validates repository health, checks for malicious code patterns,
droppers, backdoor tasks, sensitive file leakage, and NoSQL injection hazards.

Can be run standalone:
    python scripts/security_guard.py

Or automatically via pre-commit git hook.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

# Patterns indicating potential malware, cryptominers, or droppers
SUSPICIOUS_PATTERNS = [
    (re.compile(r"eval\s*\(\s*Buffer\.from", re.IGNORECASE), "Obfuscated Buffer eval"),
    (re.compile(r"eval\s*\(\s*j\s*\+\s*i\s*\)", re.IGNORECASE), "Obfuscated variable eval payload"),
    (re.compile(r"global\.i\s*=", re.IGNORECASE), "Malicious global dropper variable"),
    (re.compile(r"eth_blockNumber", re.IGNORECASE), "Crypto-miner RPC string"),
    (re.compile(r"stratum\+tcp://", re.IGNORECASE), "Mining pool stratum protocol"),
    (re.compile(r"\bnode\s+init\b", re.IGNORECASE), "Lifecycle hook calling dropper 'init'"),
]

# Filenames that are known dropper artifacts or forbidden executables
MALICIOUS_FILENAMES = {
    "init",
    "init.exe",
    "init.bat",
    "init.cmd",
    "init.sh",
    "eslint-check.cmd",
    "eslint-check.sh",
}

# Directories to skip when scanning source files
IGNORED_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    ".cache",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "__pycache__",
    ".expo",
}

# Sensitive file extensions that should never be tracked in git
SENSITIVE_EXTENSIONS = {".key", ".pem", ".pfx", ".p12", ".kdbx"}


def check_dropper_files(root: Path) -> list[str]:
    """Check for suspicious dropper files in project directories."""
    errors = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Filter out ignored directories in-place
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]

        for fname in filenames:
            if fname in MALICIOUS_FILENAMES:
                full_path = Path(dirpath) / fname
                errors.append(f"Malicious/dropper file found: {full_path}")

            # Check for dropper in .vscode
            if "eslint" in fname and ".vscode" in dirpath:
                errors.append(f"Unauthorized .vscode dropper file: {Path(dirpath) / fname}")

    return errors


def check_vscode_tasks(root: Path) -> list[str]:
    """Ensure .vscode/tasks.json does not execute automated tasks on folder open."""
    errors = []
    tasks_file = root / ".vscode" / "tasks.json"
    if tasks_file.exists():
        try:
            content = tasks_file.read_text(encoding="utf-8")
            if "folderOpen" in content:
                errors.append("CRITICAL: .vscode/tasks.json contains 'folderOpen' autostart trigger!")
            data = json.loads(content)
            tasks = data.get("tasks", [])
            if tasks:
                errors.append(f"WARNING: .vscode/tasks.json contains {len(tasks)} configured tasks.")
        except Exception as exc:
            errors.append(f"Error reading .vscode/tasks.json: {exc}")
    return errors


def check_package_json_hooks(root: Path) -> list[str]:
    """Scan all package.json files for malicious scripts or droppers."""
    errors = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
        if "package.json" in filenames:
            pkg_path = Path(dirpath) / "package.json"
            try:
                data = json.loads(pkg_path.read_text(encoding="utf-8"))
                scripts = data.get("scripts", {})
                for script_name, command in scripts.items():
                    if "node init" in command:
                        errors.append(f"Malicious command in {pkg_path} script '{script_name}': {command}")
                    if "eslint-check" in command:
                        errors.append(f"Suspicious hook in {pkg_path} script '{script_name}': {command}")
            except Exception as exc:
                errors.append(f"Error parsing {pkg_path}: {exc}")
    return errors


def check_code_patterns(root: Path) -> list[str]:
    """Scan source code for obfuscated malware or crypto mining patterns."""
    errors = []
    scan_exts = {".js", ".jsx", ".ts", ".tsx", ".py", ".json", ".yml", ".yaml", ".sh", ".cmd", ".bat"}

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]

        for fname in filenames:
            ext = Path(fname).suffix.lower()
            if ext in scan_exts and fname != "security_guard.py":
                fpath = Path(dirpath) / fname
                try:
                    text = fpath.read_text(encoding="utf-8", errors="ignore")
                    for pattern, label in SUSPICIOUS_PATTERNS:
                        if pattern.search(text):
                            errors.append(f"Suspicious pattern [{label}] in {fpath}")
                except Exception as exc:
                    errors.append(f"Failed to scan {fpath}: {exc}")
    return errors


def check_git_tracked_secrets(root: Path) -> list[str]:
    """Check git index to ensure no sensitive files or secrets are staged/tracked."""
    errors = []
    try:
        proc = subprocess.run(
            ["git", "ls-files"],
            cwd=str(root),
            capture_output=True,
            text=True,
            check=True,
        )
        tracked = proc.stdout.splitlines()
        for f in tracked:
            path_obj = Path(f)
            # Check .env files
            if path_obj.name.startswith(".env") and path_obj.name != ".env.example":
                errors.append(f"Sensitive environment file tracked in git: {f}")
            # Check sensitive extensions
            if path_obj.suffix.lower() in SENSITIVE_EXTENSIONS:
                errors.append(f"Sensitive credential/key file tracked in git: {f}")
            # Check tasks.json
            if f == ".vscode/tasks.json":
                errors.append(f"Unsafe .vscode/tasks.json is tracked in git index: {f}")
    except Exception as exc:
        errors.append(f"Failed to query git ls-files: {exc}")

    return errors


def check_nosql_injection(root: Path) -> list[str]:
    """Check backend code for forbidden MongoDB $where calls and unescaped $regex."""
    errors = []
    backend_app = root / "Mabdel Backend" / "app"
    if not backend_app.exists():
        return errors

    for dirpath, dirnames, filenames in os.walk(backend_app):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS and d != "tests"]
        for fname in filenames:
            if fname.endswith(".py"):
                fpath = Path(dirpath) / fname
                try:
                    text = fpath.read_text(encoding="utf-8", errors="ignore")
                    if '"$where"' in text or "'$where'" in text:
                        errors.append(f"CRITICAL: MongoDB $where evaluation found in {fpath}")
                    lines = text.splitlines()
                    for idx, line in enumerate(lines):
                        if '"$regex"' in line or "'$regex'" in line:
                            context = " ".join(lines[max(0, idx - 15) : min(len(lines), idx + 5)])
                            if "re.escape" not in context and "safe_regex" not in context:
                                errors.append(f"Unsanitized $regex without re.escape or safe_regex in {fpath}:{idx+1}")
                except Exception as exc:
                    errors.append(f"Failed to scan {fpath}: {exc}")
    return errors


def run_all_checks() -> bool:
    print("=" * 60)
    print("  GoCustify / Mabdel Repository Security & Health Guard")
    print("=" * 60)

    checks = [
        ("Dropper / Malicious Artifacts", check_dropper_files),
        ("VS Code Auto-Task Inspection", check_vscode_tasks),
        ("Package.json Script Integrity", check_package_json_hooks),
        ("Code Pattern / Backdoor Signatures", check_code_patterns),
        ("Git Index Secret Leakage", check_git_tracked_secrets),
        ("NoSQL $where Injection Check", check_nosql_injection),
    ]

    all_passed = True

    for name, func in checks:
        print(f"\n[*] Checking: {name}...")
        issues = func(ROOT_DIR)
        if issues:
            all_passed = False
            print(f"    FAILED ({len(issues)} issue(s) detected):")
            for issue in issues:
                print(f"      - {issue}")
        else:
            print("    PASSED - Clean")

    print("\n" + "=" * 60)
    if all_passed:
        print("  ALL SECURITY CHECKS PASSED: Repository is clean and healthy.")
        print("=" * 60)
        return True
    else:
        print("  SECURITY ISSUES DETECTED! Review and resolve errors above.")
        print("=" * 60)
        return False


if __name__ == "__main__":
    passed = run_all_checks()
    sys.exit(0 if passed else 1)
