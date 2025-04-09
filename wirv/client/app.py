import asyncio
from functools import wraps

import click


def asyncrun(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return asyncio.run(func(*args, **kwargs))

    return wrapper


@click.command()
@asyncrun
async def main():
    print("Hello, world!")


if __name__ == "__main__":
    main()
