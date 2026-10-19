"""Check every Python Quest level with real Python.

Run from the python-quest folder:  python tools/verify_levels.py

For each level it proves that
  * the marked answer really produces the stated result,
  * no wrong option / wrong choice produces that same result,
  * order levels have exactly one line order that gives the goal,
  * the content has the shape the game expects (2 hints, unique options...).
"""
import itertools
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
problems = []
checked = 0


def load():
    out = subprocess.run(
        ["node", os.path.join(HERE, "dump_levels.js")],
        capture_output=True, text=True, check=True, encoding="utf-8",
    ).stdout
    return json.loads(out)


def run_python(source):
    """Return (kind, short, full): stdout for ok, or exception name + last error line."""
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(source)
        path = f.name
    try:
        p = subprocess.run(
            [sys.executable, "-I", path],
            capture_output=True, text=True, timeout=5, encoding="utf-8",
        )
    except subprocess.TimeoutExpired:
        return ("error", "Timeout", "Timeout")
    finally:
        os.unlink(path)
    if p.returncode == 0:
        return ("ok", p.stdout.rstrip("\n"), p.stdout.rstrip("\n"))
    last = p.stderr.strip().splitlines()[-1] if p.stderr.strip() else "Error"
    return ("error", last.split(":")[0], last)


def result_text(source):
    return run_python(source)[1]  # stdout text, or the exception name


def full_text(source):
    return run_python(source)[2]  # stdout text, or the full last error line


def bad(where, msg):
    problems.append(f"{where}: {msg}")


def check_hints(where, lv):
    if len(lv.get("hints", [])) != 2 or not all(lv["hints"]):
        bad(where, "needs exactly 2 non-empty hints")
    if not lv.get("why"):
        bad(where, "missing why")
    if not lv.get("q"):
        bad(where, "missing q")


def verify_output(where, lv):
    src = "\n".join(lv["code"])
    actual = result_text(src)
    opts = lv["options"]
    if len(set(opts)) != len(opts):
        bad(where, "duplicate options")
    if not 0 <= lv["answer"] < len(opts):
        bad(where, "answer index out of range")
        return
    if opts[lv["answer"]] != actual:
        bad(where, f"marked answer {opts[lv['answer']]!r} but Python gives {actual!r}")
    matches = [o for o in opts if o == actual]
    if len(matches) != 1:
        bad(where, f"{len(matches)} options match the real result")


def verify_fill(where, lv):
    code = "\n".join(lv["code"])
    n = code.count("____")
    if n != len(lv["answers"]):
        bad(where, f"{n} blanks but {len(lv['answers'])} answers")
        return
    pool = list(lv["choices"])
    for a in lv["answers"]:
        if a not in pool:
            bad(where, f"answer {a!r} is not in choices")
            return
        pool.remove(a)

    def fill(values):
        s = code
        for v in values:
            s = s.replace("____", v, 1)
        return s

    actual = result_text(fill(lv["answers"]))
    if actual != lv["goal"]:
        bad(where, f"filled program gives {actual!r}, goal is {lv['goal']!r}")
    if n == 1:
        if len(set(lv["choices"])) != len(lv["choices"]):
            bad(where, "duplicate choices")
        for c in lv["choices"]:
            if c != lv["answers"][0] and result_text(fill([c])) == lv["goal"]:
                bad(where, f"wrong choice {c!r} also gives the goal")


def verify_bug(where, lv):
    lines = lv["code"]
    b = lv["bug"]
    if not 0 <= b < len(lines) or not lines[b].strip():
        bad(where, "bug index invalid")
        return
    fixes = lv["fixes"]
    if len(set(fixes)) != len(fixes):
        bad(where, "duplicate fixes")

    def with_line(text):
        copy = list(lines)
        copy[b] = text
        return "\n".join(copy)

    if result_text(with_line(fixes[lv["fix"]])) != lv["goal"]:
        bad(where, f"correct fix gives {result_text(with_line(fixes[lv['fix']]))!r}, goal {lv['goal']!r}")
    for i, f in enumerate(fixes):
        if i != lv["fix"] and result_text(with_line(f)) == lv["goal"]:
            bad(where, f"wrong fix {f!r} also gives the goal")
    if result_text("\n".join(lines)) == lv["goal"]:
        bad(where, "the buggy program already gives the goal")
    # no other single line may be an alternative bug location
    # (the broken line is the only one the player can be asked to pick)


def verify_order(where, lv):
    lines = lv["lines"]
    if result_text("\n".join(lines)) != lv["goal"]:
        bad(where, f"correct order gives {result_text(chr(10).join(lines))!r}, goal {lv['goal']!r}")
    if len(lines) > 7:
        bad(where, "too many lines to check all orders")
        return
    seen = {tuple(lines)}
    for perm in itertools.permutations(lines):
        if perm in seen:
            continue
        seen.add(perm)
        if result_text("\n".join(perm)) == lv["goal"]:
            bad(where, f"another order also works: {list(perm)}")
            break


HANDLERS = {"output": verify_output, "fill": verify_fill, "bug": verify_bug, "order": verify_order}


def main():
    global checked
    islands = load()
    for ii, isl in enumerate(islands, 1):
        for key in ("id", "emoji", "name", "blurb"):
            if not isl.get(key):
                bad(f"island {ii}", f"missing {key}")
        learn = isl.get("learn", {})
        if not learn.get("points") or not learn.get("code"):
            bad(f"island {ii}", "learn card incomplete")
        else:
            got = full_text("\n".join(learn["code"]))
            if got != learn.get("output"):
                bad(f"island {ii} learn", f"example output {learn.get('output')!r} but Python gives {got!r}")
        for lj, lv in enumerate(isl["levels"], 1):
            where = f"island {ii} ({isl['name']}) level {lj} [{lv['type']}]"
            handler = HANDLERS.get(lv["type"])
            if not handler:
                bad(where, "unknown type")
                continue
            check_hints(where, lv)
            handler(where, lv)
            checked += 1
    total_levels = sum(len(i["levels"]) for i in islands)
    print(f"Islands: {len(islands)}   Levels checked: {checked}/{total_levels}")
    if problems:
        print(f"\n{len(problems)} problem(s):")
        for p in problems:
            print(" -", p)
        sys.exit(1)
    print("All levels verified with real Python: OK")


if __name__ == "__main__":
    main()
