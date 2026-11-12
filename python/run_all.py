"""Run every experiment's self-check. Each file compares the from-scratch code against NumPy."""
import pathlib
import runpy
import sys

here = pathlib.Path(__file__).parent
failed = []
for path in sorted(here.glob("lab*/exp*.py")):
    print(f"\n=== {path.parent.name}/{path.name} ===")
    try:
        runpy.run_path(str(path), run_name="__main__")
    except Exception as e:  # report and keep going
        failed.append(path.name)
        print("FAILED:", e)
print("\nAll experiments passed." if not failed else f"\nFailed: {failed}")
sys.exit(1 if failed else 0)
