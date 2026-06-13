#!/usr/bin/env python3
"""Déploie Ollama (Qwen2.5-7B) sur le VPS infra UpJunoo."""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
DEPLOY_DIR = ROOT / "deploy" / "llm-api"
REMOTE_DIR = "/home/sysadmin/deploy/llm-api"
MODEL = "qwen2.5:7b-instruct-q4_K_M"

HOST = os.environ.get("VPS_HOST", "194.29.101.141")
USER = os.environ.get("VPS_USER", "sysadmin")
PASSWORD = os.environ.get("VPS_PASSWORD", "")


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 600) -> tuple[int, str, str]:
    print(f"\n$ {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip(), file=sys.stderr)
    return exit_code, out, err


def main() -> int:
    if not PASSWORD:
        print("Définissez VPS_PASSWORD (ne pas committer).", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        username=USER,
        password=PASSWORD,
        timeout=30,
        look_for_keys=False,
        allow_agent=False,
    )

    sftp = client.open_sftp()
    run(client, f"mkdir -p {REMOTE_DIR}")
    for name in ("docker-compose.yml",):
        local = DEPLOY_DIR / name
        remote = f"{REMOTE_DIR}/{name}"
        print(f"Upload {local.name} -> {remote}")
        sftp.put(str(local), remote)
    sftp.close()

    code, _, _ = run(client, f"cd {REMOTE_DIR} && docker compose pull")
    if code != 0:
        return code

    code, _, _ = run(client, f"cd {REMOTE_DIR} && docker compose up -d")
    if code != 0:
        return code

    print("\nAttente démarrage Ollama (15s)...")
    time.sleep(15)

    code, out, _ = run(
        client,
        "curl -s http://127.0.0.1:11434/api/tags || echo NOT_READY",
        timeout=30,
    )
    if "NOT_READY" in out and "models" not in out:
        print("Ollama pas encore prêt, nouvel essai...")
        time.sleep(15)

    print(f"\nTéléchargement modèle {MODEL} (peut prendre 10–30 min)...")
    code, _, _ = run(
        client,
        f"docker exec ollama ollama pull {MODEL}",
        timeout=3600,
    )
    if code != 0:
        return code

    code, model_list, _ = run(client, "docker exec ollama ollama list", timeout=60)
    code2, health, _ = run(
        client,
        'curl -s http://127.0.0.1:11434/api/generate -d '
        '\'{"model":"' + MODEL + '","prompt":"Dis bonjour en français.","stream":false}\' '
        "| head -c 400",
        timeout=300,
    )

    # Nginx /llm-api/ sur uat.upjunoo.com
    nginx_file = "/etc/nginx/sites-enabled/uat.upjunoo.com"
    snippet = (DEPLOY_DIR / "nginx-uat-llm-api.snippet.conf").read_text(encoding="utf-8").strip()
    patch = f'''#!/usr/bin/env python3
from pathlib import Path
p = Path("{nginx_file}")
text = p.read_text(encoding="utf-8")
if "location /llm-api/" in text:
    print("ALREADY")
else:
    anchor = "    # Proxy API back-office"
    if anchor not in text:
        raise SystemExit("anchor nginx introuvable")
    snippet = """{snippet}"""
    p.write_text(text.replace(anchor, snippet + "\\n\\n" + anchor, 1), encoding="utf-8")
    print("INSERTED")
'''
    sftp = client.open_sftp()
    with sftp.file("/tmp/patch_nginx_llm.py", "w") as f:
        f.write(patch)
    sftp.close()

    code, patch_out, _ = run(client, "sudo python3 /tmp/patch_nginx_llm.py && rm -f /tmp/patch_nginx_llm.py")
    if code != 0:
        client.close()
        return code

    code, _, _ = run(client, "sudo nginx -t && sudo systemctl reload nginx")
    if code != 0:
        client.close()
        return code

    code3, pub, _ = run(
        client,
        "curl -sk https://uat.upjunoo.com/llm-api/api/tags | head -c 200",
        timeout=30,
    )

    client.close()

    print("\n=== Déploiement terminé ===")
    print(f"Modèles:\n{model_list}")
    print(f"Nginx: {patch_out.strip()}")
    print(f"Test génération (extrait):\n{health[:400]}")
    print(f"Test public nginx:\n{pub[:200]}")
    print("\nURL interne: http://127.0.0.1:11434")
    print("URL publique: https://uat.upjunoo.com/llm-api/")
    return 0 if code2 == 0 and code3 == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
