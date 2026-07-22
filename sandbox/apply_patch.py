#!/usr/bin/env python3
"""Apply the text patch format used by Codex. Apache-2.0-compatible behavioral port."""
import os
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path("/workspace").resolve()

class PatchError(Exception): pass

def safe_path(raw: str, *, existing=False) -> pathlib.Path:
    if not raw or "\0" in raw or pathlib.PurePosixPath(raw).is_absolute() or ".." in pathlib.PurePosixPath(raw).parts:
        raise PatchError(f"invalid path: {raw}")
    target = ROOT.joinpath(*pathlib.PurePosixPath(raw).parts)
    parent = target.parent.resolve(strict=False)
    if parent != ROOT and ROOT not in parent.parents: raise PatchError(f"path escapes /workspace: {raw}")
    resolved = target.resolve(strict=False)
    if resolved != ROOT and ROOT not in resolved.parents: raise PatchError(f"path escapes /workspace: {raw}")
    if target.exists() and target.is_dir(): raise PatchError(f"path is a directory: {raw}")
    if existing and not target.exists(): raise PatchError(f"file does not exist: {raw}")
    return target

def find_context(lines, old, start):
    if not old: return start
    for i in range(start, len(lines) - len(old) + 1):
        if lines[i:i+len(old)] == old: return i
    stripped = [line.strip() for line in old]
    hits = [i for i in range(start, len(lines)-len(old)+1) if [line.strip() for line in lines[i:i+len(old)]] == stripped]
    if len(hits) == 1: return hits[0]
    raise PatchError("update context was not found uniquely")

def update_file(path, body):
    original = path.read_text(encoding="utf-8")
    lines = original.splitlines(); had_newline = original.endswith("\n"); cursor = 0; index = 0
    while index < len(body):
        if not body[index].startswith("@@"): raise PatchError("malformed update hunk")
        index += 1; old=[]; new=[]
        while index < len(body) and not body[index].startswith("@@"):
            line=body[index]; index += 1
            if line == "*** End of File": continue
            if not line or line[0] not in " +-": raise PatchError("malformed hunk line")
            text=line[1:]
            if line[0] in " -": old.append(text)
            if line[0] in " +": new.append(text)
        at=find_context(lines, old, cursor); lines[at:at+len(old)]=new; cursor=at+len(new)
    path.write_text("\n".join(lines) + ("\n" if had_newline else ""), encoding="utf-8")

def main():
    text=sys.stdin.read()
    if not text.strip(): raise PatchError("empty patch")
    rows=text.splitlines()
    if not rows or rows[0] != "*** Begin Patch" or rows[-1] != "*** End Patch": raise PatchError("patch must begin with '*** Begin Patch' and end with '*** End Patch'")
    i=1; changes=[]
    while i < len(rows)-1:
        match=re.fullmatch(r"\*\*\* (Add|Update|Delete) File: (.+)", rows[i])
        if not match: raise PatchError(f"malformed file header: {rows[i]}")
        action, raw=match.groups(); i += 1; move=None
        if action == "Update" and i < len(rows)-1 and rows[i].startswith("*** Move to: "): move=rows[i][13:]; i += 1
        body=[]
        while i < len(rows)-1 and not re.match(r"^\*\*\* (Add|Update|Delete) File: ", rows[i]): body.append(rows[i]); i += 1
        if action == "Add":
            target=safe_path(raw)
            if target.exists(): raise PatchError(f"file already exists: {raw}")
            if any(not line.startswith("+") for line in body): raise PatchError("add file lines must start with '+'")
            target.parent.mkdir(parents=True, exist_ok=True); target.write_text("".join(line[1:]+"\n" for line in body), encoding="utf-8"); changes.append(("added", raw))
        elif action == "Delete":
            target=safe_path(raw, existing=True)
            if body: raise PatchError("delete file section must be empty")
            target.unlink(); changes.append(("deleted", raw))
        else:
            target=safe_path(raw, existing=True); update_file(target, body)
            if move:
                destination=safe_path(move)
                if destination.exists(): raise PatchError(f"move destination exists: {move}")
                destination.parent.mkdir(parents=True, exist_ok=True); shutil.move(target, destination); changes.append(("moved", f"{raw} -> {move}"))
            else: changes.append(("modified", raw))
    if not changes: raise PatchError("patch has no file operations")
    for action, path in changes: print(f"{action}: {path}")

try: main()
except (PatchError, UnicodeError, OSError) as error:
    print(f"apply_patch: {error}", file=sys.stderr); sys.exit(1)
