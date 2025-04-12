from pathlib import Path

from jinja2 import Environment, FileSystemLoader

DIR = Path(__file__).parent

env = Environment(loader=FileSystemLoader(DIR.absolute()))

index = env.get_template("index.html")
