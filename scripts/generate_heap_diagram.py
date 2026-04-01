#!/usr/bin/env python3
"""Generate a heap/tree diagram SVG from a level-order array.

Example:
  python3 scripts/generate_heap_diagram.py \
    --array "[90, 88, 55, 33, 80]" \
    --output _static/images/heap/example.svg \
    --color orange:[90] \
    --color gray:[80] \
    --show-indices
"""

from __future__ import annotations

import argparse
import ast
import html
import json
import math
import re
from pathlib import Path
from typing import Iterable


NULL_TOKENS = {"none", "null", "_"}
COLOR_ALIASES = {
    "red": "#dc6b6b",
    "orange": "#f59e0b",
    "yellow": "#eabf4b",
    "green": "#7bbf8e",
    "blue": "#7da6d9",
    "gray": "#d9dddc",
    "grey": "#d9dddc",
    "purple": "#b39bcf",
    "teal": "#73b8b8",
}


def parse_array(raw: str) -> list[object | None]:
    raw = raw.strip()
    try:
        value = ast.literal_eval(raw)
    except (SyntaxError, ValueError) as exc:
        try:
            value = json.loads(raw)
        except json.JSONDecodeError:
            raise SystemExit(f"Invalid array literal: {raw}") from exc

    if not isinstance(value, (list, tuple)):
        raise SystemExit("--array must be a Python-style list, e.g. '[90, 88, 55, 33, 80]'")

    result: list[object | None] = []
    for item in value:
        if isinstance(item, str) and item.strip().lower() in NULL_TOKENS:
            result.append(None)
        else:
            result.append(item)
    return result


def resolve_color(color: str) -> str:
    normalized = color.strip().lower()
    return COLOR_ALIASES.get(normalized, color.strip())


def parse_value_group(raw_values: str) -> list[str]:
    raw_values = raw_values.strip()
    try:
        parsed = ast.literal_eval(raw_values)
    except (SyntaxError, ValueError):
        try:
            parsed = json.loads(raw_values)
        except json.JSONDecodeError:
            parsed = None

    if isinstance(parsed, (list, tuple)):
        return [str(item) for item in parsed]

    compact = raw_values.strip()
    if compact.startswith("[") and compact.endswith("]"):
        compact = compact[1:-1]
    tokens = [token for token in re.split(r"[\s,]+", compact) if token]
    if not tokens:
        raise SystemExit(f"Invalid value list '{raw_values}'. Use something like [1, 2, 3]")
    return tokens


def parse_color_groups(groups: Iterable[str]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for group in groups:
        if ":" not in group:
            raise SystemExit(f"Invalid color group '{group}'. Use COLOR:[values], for example orange:[1, 2, 3]")
        raw_color, raw_values = group.split(":", 1)
        color = resolve_color(raw_color)
        for value in parse_value_group(raw_values):
            mapping[value] = color
    return mapping


def svg_text(x: float, y: float, text: str, *, size: int = 22, weight: str = "700", fill: str = "#1f2937") -> str:
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" dominant-baseline="middle" '
        f'font-family="Arial, Helvetica, sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}">'
        f"{html.escape(text)}</text>"
    )


def generate_svg(
    values: list[object | None],
    value_colors: dict[object, str],
    *,
    show_indices: bool,
) -> str:
    if not values:
        raise SystemExit("Array is empty")

    indices = [i for i, value in enumerate(values) if value is not None]
    if not indices:
        raise SystemExit("Array contains only null values")

    max_index = max(indices)
    depth = int(math.floor(math.log2(max_index + 1)))

    # Preserve exact heap order from array indices, including hidden null slots.
    side_padding = 34
    top_padding = 72
    bottom_padding = 70 if show_indices else 42
    radius = 30
    level_gap = 110 if depth <= 3 else 100
    bottom_slots = 2**depth
    slot_width = max(74, 96 - depth * 6)
    usable_width = max(180, bottom_slots * slot_width)
    width = int(usable_width + side_padding * 2)
    height = top_padding + depth * level_gap + bottom_padding + radius

    positions: dict[int, tuple[float, float]] = {}
    for index in indices:
        level = int(math.floor(math.log2(index + 1)))
        level_start = 2**level - 1
        offset = index - level_start
        slots = 2**level
        x = side_padding + usable_width * ((offset + 0.5) / slots)
        y = top_padding + level * level_gap
        positions[index] = (x, y)

    parts: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}">'
        ),
        f'<rect x="0" y="0" width="{width}" height="{height}" fill="#ffffff"/>',
    ]

    for index in indices:
        left = 2 * index + 1
        right = 2 * index + 2
        x1, y1 = positions[index]
        for child in (left, right):
            if child in positions:
                x2, y2 = positions[child]
                parts.append(
                    f'<line x1="{x1:.1f}" y1="{y1 + radius - 2:.1f}" '
                    f'x2="{x2:.1f}" y2="{y2 - radius + 2:.1f}" '
                    'stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>'
                )

    for index in indices:
        x, y = positions[index]
        value = values[index]
        fill = value_colors.get(value, "#ffffff")
        parts.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{radius}" fill="{fill}" '
            'stroke="#334155" stroke-width="3"/>'
        )
        parts.append(svg_text(x, y, str(value), fill="#111827"))
        if show_indices:
            parts.append(svg_text(x, y + radius + 20, str(index), size=14, weight="600", fill="#64748b"))

    parts.append("</svg>")
    return "\n".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a heap diagram SVG from a level-order array")
    parser.add_argument("--array", required=True, help="Python-style level-order array, e.g. '[90, 88, 55, 33, 80]'")
    parser.add_argument("--output", required=True, help="Output SVG filename")
    parser.add_argument(
        "--color",
        action="append",
        nargs="+",
        default=[],
        metavar="COLOR:[VALUES]",
        help="Color one or more values, e.g. orange:[1,2,3] or gray:[4, 5 6]",
    )
    parser.add_argument(
        "--show-indices",
        action="store_true",
        help="Show array indices under each visible node",
    )
    args = parser.parse_args()

    values = parse_array(args.array)
    raw_color_groups = [" ".join(group).strip() for group in args.color]
    value_colors = parse_color_groups(raw_color_groups)

    # Match numeric values supplied on the command line against their string form.
    values_for_lookup = [None if value is None else str(value) for value in values]
    svg = generate_svg(values_for_lookup, value_colors, show_indices=args.show_indices)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(svg, encoding="utf-8")
    print(f"Saved {output_path}")


if __name__ == "__main__":
    main()
