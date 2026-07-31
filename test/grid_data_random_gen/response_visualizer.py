import json
from argparse import ArgumentParser, Namespace
from pathlib import Path
from typing import Any


Coordinate = list[int]
Point = tuple[int, int]


def validate_coordinate(
    value: Any,
    source_name: str,
    index: int,
) -> Point:
    """
    Validate and convert one JSON coordinate into a Point.
    """

    if not isinstance(value, list):
        raise ValueError(
            f"{source_name}[{index}] must be a list, "
            f"but received {type(value).__name__}"
        )

    if len(value) != 2:
        raise ValueError(
            f"{source_name}[{index}] must contain exactly "
            f"two values: [x, y]"
        )

    x, y = value

    if (
        isinstance(x, bool)
        or isinstance(y, bool)
        or not isinstance(x, int)
        or not isinstance(y, int)
    ):
        raise ValueError(
            f"{source_name}[{index}] must contain integers: "
            f"[x, y]"
        )

    if x < 0 or y < 0:
        raise ValueError(
            f"{source_name}[{index}] contains a negative "
            f"coordinate: [{x}, {y}]"
        )

    return x, y


def extract_coordinate_array(
    data: Any,
    source_name: str,
    accepted_keys: tuple[str, ...],
) -> list[Any]:
    """
    Accept either a direct coordinate array:

        [[0, 0], [1, 0]]

    or an object containing one of the accepted keys:

        {
            "path": [[0, 0], [1, 0]]
        }
    """

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        for key in accepted_keys:
            coordinates = data.get(key)

            if isinstance(coordinates, list):
                return coordinates

        key_text = ", ".join(
            f'"{key}"'
            for key in accepted_keys
        )

        raise ValueError(
            f"{source_name} is a JSON object, but it does not "
            f"contain a coordinate array under: {key_text}"
        )

    raise ValueError(
        f"{source_name} must contain either a coordinate array "
        f"or a JSON object containing one"
    )


def load_coordinates(
    file_path: str,
    accepted_keys: tuple[str, ...],
) -> list[Point]:
    """
    Load coordinates from a JSON file.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"JSON file does not exist: {path}"
        )

    if not path.is_file():
        raise ValueError(
            f"Path is not a file: {path}"
        )

    try:
        with path.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

    except json.JSONDecodeError as error:
        raise ValueError(
            f"Invalid JSON in {path}: "
            f"line {error.lineno}, column {error.colno}: "
            f"{error.msg}"
        ) from error

    raw_coordinates = extract_coordinate_array(
        data=data,
        source_name=str(path),
        accepted_keys=accepted_keys,
    )

    coordinates: list[Point] = []

    for index, value in enumerate(raw_coordinates):
        coordinate = validate_coordinate(
            value=value,
            source_name=str(path),
            index=index,
        )

        coordinates.append(coordinate)

    return coordinates


def infer_grid_size(
    grid: list[Point],
    path: list[Point],
    requested_length: int | None,
    requested_width: int | None,
) -> tuple[int, int]:
    """
    Infer grid dimensions from the largest coordinates.

    Explicit --length and --width values override inferred values.
    """

    all_coordinates = grid + path

    if not all_coordinates:
        raise ValueError(
            "Both grid and path files are empty"
        )

    inferred_length = (
        max(x for x, _ in all_coordinates)
        + 1
    )

    inferred_width = (
        max(y for _, y in all_coordinates)
        + 1
    )

    length = (
        requested_length
        if requested_length is not None
        else inferred_length
    )

    width = (
        requested_width
        if requested_width is not None
        else inferred_width
    )

    if length <= 0:
        raise ValueError(
            "Grid length must be greater than 0"
        )

    if width <= 0:
        raise ValueError(
            "Grid width must be greater than 0"
        )

    for x, y in all_coordinates:
        if not (
            0 <= x < length
            and 0 <= y < width
        ):
            raise ValueError(
                f"Coordinate [{x}, {y}] is outside the "
                f"configured {length} x {width} grid"
            )

    return length, width


def analyze_path(
    grid: list[Point],
    path: list[Point],
) -> list[str]:
    """
    Check whether the server path is valid against the grid.

    The function returns warnings instead of immediately failing,
    so malformed paths can still be visualized for debugging.
    """

    warnings: list[str] = []
    walkable = set(grid)

    if not path:
        warnings.append(
            "The path file contains no coordinates."
        )

        return warnings

    duplicate_count = (
        len(path)
        - len(set(path))
    )

    if duplicate_count > 0:
        warnings.append(
            f"The path contains {duplicate_count} repeated "
            f"coordinate(s)."
        )

    outside_grid = [
        point
        for point in path
        if point not in walkable
    ]

    if outside_grid:
        preview = ", ".join(
            str(list(point))
            for point in outside_grid[:5]
        )

        if len(outside_grid) > 5:
            preview += ", ..."

        warnings.append(
            f"{len(outside_grid)} path coordinate(s) are not "
            f"present in grid.json: {preview}"
        )

    invalid_steps: list[
        tuple[int, Point, Point, int]
    ] = []

    for index in range(1, len(path)):
        previous = path[index - 1]
        current = path[index]

        distance = (
            abs(current[0] - previous[0])
            + abs(current[1] - previous[1])
        )

        if distance != 1:
            invalid_steps.append(
                (
                    index,
                    previous,
                    current,
                    distance,
                )
            )

    if invalid_steps:
        previews: list[str] = []

        for (
            index,
            previous,
            current,
            distance,
        ) in invalid_steps[:5]:
            previews.append(
                f"step {index}: "
                f"{list(previous)} -> {list(current)} "
                f"(distance={distance})"
            )

        preview_text = "; ".join(previews)

        if len(invalid_steps) > 5:
            preview_text += "; ..."

        warnings.append(
            f"The path contains {len(invalid_steps)} "
            f"non-adjacent step(s): {preview_text}"
        )

    return warnings


def print_summary(
    grid: list[Point],
    path: list[Point],
    length: int,
    width: int,
    warnings: list[str],
) -> None:
    """
    Print a concise path report.
    """

    print(
        f"Grid size:       {length} x {width}"
    )

    print(
        f"Walkable cells:  {len(set(grid))}"
    )

    print(
        f"Path points:     {len(path)}"
    )

    path_cost = max(
        0,
        len(path) - 1,
    )

    print(
        f"Path cost:       {path_cost}"
    )

    if path:
        print(
            f"Start:           {list(path[0])}"
        )

        print(
            f"End:             {list(path[-1])}"
        )

    if warnings:
        print("\nWarnings:")

        for warning in warnings:
            print(
                f"  - {warning}"
            )

    else:
        print(
            "\nPath validation: OK"
        )


def visualize_ascii(
    grid: list[Point],
    path: list[Point],
    length: int,
    width: int,
) -> None:
    """
    Terminal visualization.

    S = start
    E = end
    * = server-generated path
    . = walkable grid
    # = blocked cell
    ! = path coordinate outside the walkable grid
    """

    walkable = set(grid)
    path_cells = set(path)

    start = (
        path[0]
        if path
        else None
    )

    end = (
        path[-1]
        if path
        else None
    )

    print()

    for y in range(width):
        row: list[str] = []

        for x in range(length):
            point = (x, y)

            if point == start:
                symbol = "S"

            elif point == end:
                symbol = "E"

            elif (
                point in path_cells
                and point not in walkable
            ):
                symbol = "!"

            elif point in path_cells:
                symbol = "*"

            elif point in walkable:
                symbol = "."

            else:
                symbol = "#"

            row.append(symbol)

        print(
            " ".join(row)
        )

    print()


def visualize_matplotlib(
    grid: list[Point],
    path: list[Point],
    length: int,
    width: int,
    output_file: str | None,
    show_step_numbers: bool,
    title: str,
) -> None:
    """
    Draw the walkable grid and overlay the server-generated path.
    """

    try:
        import matplotlib.pyplot as plt
        import numpy as np
        from matplotlib.colors import ListedColormap

    except ImportError as error:
        raise RuntimeError(
            "GUI visualization requires matplotlib and numpy.\n"
            "Install them with:\n"
            "pip install matplotlib numpy"
        ) from error

    #
    # Cell values:
    # 0 = blocked
    # 1 = walkable
    # 2 = path
    # 3 = invalid path coordinate
    #
    matrix = np.zeros(
        (
            width,
            length,
        ),
        dtype=int,
    )

    walkable = set(grid)
    path_cells = set(path)

    for x, y in walkable:
        matrix[y, x] = 1

    for x, y in path_cells:
        if (x, y) in walkable:
            matrix[y, x] = 2
        else:
            matrix[y, x] = 3

    color_map = ListedColormap(
        [
            "#16181d",
            "#d8dde6",
            "#f5b642",
            "#ef4444",
        ]
    )

    figure_width = max(
        8.0,
        min(18.0, length / 6.0),
    )

    figure_height = max(
        6.0,
        min(16.0, width / 6.0),
    )

    fig, ax = plt.subplots(
        figsize=(
            figure_width,
            figure_height,
        )
    )

    ax.imshow(
        matrix,
        origin="upper",
        interpolation="none",
        cmap=color_map,
        vmin=0,
        vmax=3,
    )

    #
    # Draw a line following the exact order of path.json.
    #
    if len(path) >= 2:
        path_x = [
            x
            for x, _ in path
        ]

        path_y = [
            y
            for _, y in path
        ]

        ax.plot(
            path_x,
            path_y,
            linewidth=2.5,
            marker="o",
            markersize=3,
            label="Server path",
        )

    if path:
        start_x, start_y = path[0]
        end_x, end_y = path[-1]

        ax.scatter(
            start_x,
            start_y,
            marker="o",
            s=140,
            edgecolors="black",
            linewidths=1,
            zorder=5,
            label="Start",
        )

        ax.scatter(
            end_x,
            end_y,
            marker="X",
            s=160,
            edgecolors="black",
            linewidths=1,
            zorder=5,
            label="End",
        )

    if show_step_numbers:
        for step, (x, y) in enumerate(path):
            ax.text(
                x,
                y,
                str(step),
                ha="center",
                va="center",
                fontsize=7,
                zorder=6,
            )

    #
    # Grid cell boundaries
    #
    ax.set_xticks(
        np.arange(
            -0.5,
            length,
            1,
        ),
        minor=True,
    )

    ax.set_yticks(
        np.arange(
            -0.5,
            width,
            1,
        ),
        minor=True,
    )

    ax.grid(
        which="minor",
        linewidth=0.25,
        alpha=0.35,
    )

    ax.tick_params(
        which="minor",
        bottom=False,
        left=False,
    )

    #
    # Avoid overcrowding axes on large maps.
    #
    x_tick_interval = max(
        1,
        length // 20,
    )

    y_tick_interval = max(
        1,
        width // 20,
    )

    ax.set_xticks(
        range(
            0,
            length,
            x_tick_interval,
        )
    )

    ax.set_yticks(
        range(
            0,
            width,
            y_tick_interval,
        )
    )

    ax.set_xlim(
        -0.5,
        length - 0.5,
    )

    ax.set_ylim(
        width - 0.5,
        -0.5,
    )

    ax.set_aspect("equal")

    ax.set_title(
        title
    )

    ax.set_xlabel("X")
    ax.set_ylabel("Y")

    if path:
        ax.legend(
            loc="upper right"
        )

    plt.tight_layout()

    if output_file:
        output_path = Path(
            output_file
        )

        if output_path.parent != Path("."):
            output_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

        fig.savefig(
            output_path,
            dpi=200,
            bbox_inches="tight",
        )

        print(
            f"Visualization saved to: {output_path}"
        )

    plt.show()


def main(
    args: Namespace,
) -> None:
    grid = load_coordinates(
        file_path=args.grid,
        accepted_keys=(
            "grid",
            "walkable",
            "coordinates",
            "data",
        ),
    )

    path = load_coordinates(
        file_path=args.path,
        accepted_keys=(
            "path",
            "route",
            "coordinates",
            "data",
        ),
    )

    length, width = infer_grid_size(
        grid=grid,
        path=path,
        requested_length=args.length,
        requested_width=args.width,
    )

    warnings = analyze_path(
        grid=grid,
        path=path,
    )

    print_summary(
        grid=grid,
        path=path,
        length=length,
        width=width,
        warnings=warnings,
    )

    if args.visualize == "ascii":
        visualize_ascii(
            grid=grid,
            path=path,
            length=length,
            width=width,
        )

    elif args.visualize == "gui":
        visualize_matplotlib(
            grid=grid,
            path=path,
            length=length,
            width=width,
            output_file=args.output,
            show_step_numbers=args.show_step_numbers,
            title=args.title,
        )


if __name__ == "__main__":
    parser = ArgumentParser(
        prog="5thSense Path Visualizer",
        description=(
            "Load a generated grid JSON and a server path JSON, "
            "then validate and visualize the path"
        ),
    )

    parser.add_argument(
        "-g",
        "--grid",
        type=str,
        default="grid.json",
        help=(
            "Path to the walkable grid JSON "
            "(default: grid.json)"
        ),
    )

    parser.add_argument(
        "-p",
        "--path",
        type=str,
        default="path.json",
        help=(
            "Path to the server-generated route JSON "
            "(default: path.json)"
        ),
    )

    parser.add_argument(
        "-v",
        "--visualize",
        choices=[
            "ascii",
            "gui",
        ],
        default="gui",
        help=(
            "Visualization mode "
            "(default: gui)"
        ),
    )

    parser.add_argument(
        "-l",
        "--length",
        type=int,
        default=None,
        help=(
            "Explicit grid length. "
            "By default it is inferred from the JSON files"
        ),
    )

    parser.add_argument(
        "-w",
        "--width",
        type=int,
        default=None,
        help=(
            "Explicit grid width. "
            "By default it is inferred from the JSON files"
        ),
    )

    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default=None,
        help=(
            "Optional output image path, "
            "for example path-result.png"
        ),
    )

    parser.add_argument(
        "--show-step-numbers",
        action="store_true",
        help=(
            "Display each path coordinate's sequence number"
        ),
    )

    parser.add_argument(
        "--title",
        type=str,
        default="5thSense A* Path Visualization",
        help="Visualization title",
    )

    arguments: Namespace = parser.parse_args()

    main(arguments)