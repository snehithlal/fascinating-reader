"""Project paths, independent of the shell's working directory."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
DATA = ROOT / "data"
RESOURCES = ROOT / "resources"
SCHEMAS = RESOURCES / "schemas"
PROMPTS = RESOURCES / "prompts"
STARTERS = RESOURCES / "starters"
RUNTIME = ROOT / "var"
