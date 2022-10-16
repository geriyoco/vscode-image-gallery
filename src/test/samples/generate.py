#!/usr/env/bin python3
from datetime import datetime
import inspect
import pathlib
import os
import time
from typing import Tuple, Union

from PIL import Image, ImageDraw

def generate(
    path: Union[str, pathlib.Path],
    size: Tuple[int, int],
    modified_datetime: str,
):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    image = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(image)
    draw.text(
        (10, 10),
        inspect.cleandoc(f'''
            Name: {path.name}
            Dimensions: {size[0]}x{size[1]}
            Modified: {modified_datetime}
        '''),
        fill='black',
    )
    image.save(path)

    mtime = time.mktime(datetime.fromisoformat(modified_datetime).timetuple())
    os.utime(path, (mtime, mtime))

if __name__ == '__main__':
    generate('folder1/image.png', (200, 300), '2000-01-01T00:00:04')
    generate('folder1/image1.png', (200, 200), '2000-01-01T00:00:03')
    generate('folder1/image2.png', (200, 300), '2000-01-01T00:00:02')
    generate('folder1/image10.png', (200, 400), '2000-01-01T00:00:01')

    generate('folder2/figure.png', (200, 300), '2000-01-01T00:00:03')
    generate('folder2/image.png', (200, 200), '2000-01-01T00:00:02')
    generate('folder2/plot.png', (200, 400), '2000-01-01T00:00:01')
