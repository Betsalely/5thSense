import json
import random
from argparse import ArgumentParser, Namespace


Coordinate = list[int]
Point = tuple[int, int]


def get_walkable_clearance(
    x: int,
    y: int,
    walkable: set[Point],
    ignore: set[Point] | None = None,
) -> int:
    """
    Return the minimum Manhattan distance from (x, y)
    to any existing walkable cell.

    Cells inside `ignore` are excluded from the calculation.
    """

    if ignore is None:
        ignore = set()

    minimum_distance: int | None = None

    for wx, wy in walkable:
        if (wx, wy) in ignore:
            continue

        distance = abs(x - wx) + abs(y - wy)

        if (
            minimum_distance is None
            or distance < minimum_distance
        ):
            minimum_distance = distance

    if minimum_distance is None:
        return 999999

    return minimum_distance


def get_local_walkable_density(
    x: int,
    y: int,
    walkable: set[Point],
    radius: int,
    ignore: set[Point] | None = None,
) -> int:
    """
    Count existing walkable cells inside a Manhattan radius.

    Used to discourage branches from growing toward areas
    where many paths are already concentrated.
    """

    if ignore is None:
        ignore = set()

    density = 0

    for wx, wy in walkable:
        if (wx, wy) in ignore:
            continue

        distance = abs(x - wx) + abs(y - wy)

        if distance <= radius:
            density += 1

    return density


def connect_points(
    start: Point,
    end: Point,
    walkable: set[Point],
) -> None:
    """
    Connect two points using a Manhattan path.

    X-first or Y-first is chosen randomly.
    """

    x, y = start
    target_x, target_y = end

    move_x_first = random.choice(
        [True, False]
    )

    if move_x_first:
        while x != target_x:
            x += 1 if target_x > x else -1
            walkable.add((x, y))

        while y != target_y:
            y += 1 if target_y > y else -1
            walkable.add((x, y))

    else:
        while y != target_y:
            y += 1 if target_y > y else -1
            walkable.add((x, y))

        while x != target_x:
            x += 1 if target_x > x else -1
            walkable.add((x, y))


def connect_nearby_branches(
    walkable: set[Point],
    branches: list[set[Point]],
    connection_probability: float = 0.20,
    max_connection_distance: int = 10,
) -> None:
    """
    Randomly connect nearby branches.

    The closest points between each branch pair are found.
    Closer branch pairs are considered first.
    """

    if len(branches) < 2:
        return

    branch_pairs: list[
        tuple[
            int,
            int,
            int,
            Point,
            Point,
        ]
    ] = []

    for i in range(len(branches)):
        for j in range(i + 1, len(branches)):
            branch_a = branches[i]
            branch_b = branches[j]

            best_distance: int | None = None
            best_a: Point | None = None
            best_b: Point | None = None

            for ax, ay in branch_a:
                for bx, by in branch_b:
                    distance = (
                        abs(ax - bx)
                        + abs(ay - by)
                    )

                    if (
                        best_distance is None
                        or distance < best_distance
                    ):
                        best_distance = distance
                        best_a = (ax, ay)
                        best_b = (bx, by)

            if (
                best_distance is None
                or best_a is None
                or best_b is None
            ):
                continue

            if best_distance <= max_connection_distance:
                branch_pairs.append(
                    (
                        best_distance,
                        i,
                        j,
                        best_a,
                        best_b,
                    )
                )

    branch_pairs.sort(
        key=lambda item: item[0]
    )

    connected_pairs: set[
        tuple[int, int]
    ] = set()

    for (
        _distance,
        branch_a_index,
        branch_b_index,
        start,
        end,
    ) in branch_pairs:

        pair_key = (
            branch_a_index,
            branch_b_index,
        )

        if pair_key in connected_pairs:
            continue

        if random.random() > connection_probability:
            continue

        connect_points(
            start,
            end,
            walkable,
        )

        connected_pairs.add(
            pair_key
        )


def generate_random_grid(
    length: int,
    width: int,
    branch_probability: float = 0.97,
    max_branch_length: int = 80,
    branch_count: int = 70,
    connection_probability: float = 0.20,
    max_connection_distance: int = 10,
    min_branch_spacing: int = 5,
) -> list[Coordinate]:

    if length <= 0:
        raise ValueError(
            "Length must be greater than 0"
        )

    if width <= 0:
        raise ValueError(
            "Width must be greater than 0"
        )

    if not 0.0 <= branch_probability <= 1.0:
        raise ValueError(
            "Branch probability must be between 0 and 1"
        )

    if not 0.0 <= connection_probability <= 1.0:
        raise ValueError(
            "Connection probability must be between 0 and 1"
        )

    if max_branch_length <= 0:
        raise ValueError(
            "Maximum branch length must be greater than 0"
        )

    if branch_count < 0:
        raise ValueError(
            "Branch count must not be negative"
        )

    if min_branch_spacing < 1:
        raise ValueError(
            "Minimum branch spacing must be at least 1"
        )

    walkable: set[Point] = set()
    branches: list[set[Point]] = []

    directions: list[Point] = [
        (1, 0),
        (-1, 0),
        (0, 1),
        (0, -1),
    ]

    #
    # ------------------------------------------------------------
    # 1. Guaranteed main path
    # ------------------------------------------------------------
    #

    x = 0
    y = 0

    walkable.add(
        (x, y)
    )

    while (
        x < length - 1
        or y < width - 1
    ):
        possible_moves: list[Point] = []

        if x < length - 1:
            possible_moves.append(
                (x + 1, y)
            )

        if y < width - 1:
            possible_moves.append(
                (x, y + 1)
            )

        x, y = random.choice(
            possible_moves
        )

        walkable.add(
            (x, y)
        )

    #
    # ------------------------------------------------------------
    # 2. Generate branches
    # ------------------------------------------------------------
    #

    for _ in range(branch_count):

        branch_x, branch_y = random.choice(
            list(walkable)
        )

        branch_length = random.randint(
            2,
            max_branch_length,
        )

        previous_direction: Point | None = None

        branch_cells: set[Point] = {
            (branch_x, branch_y)
        }

        for _ in range(branch_length):

            candidates: list[
                tuple[
                    float,
                    int,
                    int,
                    int,
                    int,
                ]
            ] = []

            for dx, dy in directions:

                #
                # Prevent immediate reverse movement
                #
                if previous_direction is not None:
                    reverse_direction = (
                        -previous_direction[0],
                        -previous_direction[1],
                    )

                    if (dx, dy) == reverse_direction:
                        continue

                new_x = branch_x + dx
                new_y = branch_y + dy

                #
                # Bounds check
                #
                if not (
                    0 <= new_x < length
                    and 0 <= new_y < width
                ):
                    continue

                #
                # Prevent the branch from walking over itself
                #
                if (new_x, new_y) in branch_cells:
                    continue

                #
                # Do not directly step onto an existing path
                #
                if (new_x, new_y) in walkable:
                    continue

                #
                # Calculate minimum distance from existing paths
                #
                clearance = get_walkable_clearance(
                    new_x,
                    new_y,
                    walkable,
                    ignore=branch_cells,
                )

                #
                # At the beginning of a branch, it must naturally
                # leave the parent path first.
                #
                # The required spacing gradually increases until
                # min_branch_spacing is reached.
                #
                branch_depth = (
                    len(branch_cells) - 1
                )

                required_spacing = min(
                    min_branch_spacing,
                    branch_depth + 1,
                )

                #
                # HARD spacing constraint
                #
                if clearance < required_spacing:
                    continue

                #
                # Avoid areas where many paths are already packed
                #
                density_radius = (
                    min_branch_spacing + 2
                )

                local_density = (
                    get_local_walkable_density(
                        new_x,
                        new_y,
                        walkable,
                        radius=density_radius,
                        ignore=branch_cells,
                    )
                )

                #
                # Strongly reward open space.
                #
                # Clearance is the most important factor.
                #
                score = (
                    clearance * 12.0
                    - local_density * 4.0
                    + random.random() * 0.35
                )

                candidates.append(
                    (
                        score,
                        new_x,
                        new_y,
                        dx,
                        dy,
                    )
                )

            #
            # No valid direction available:
            # this becomes a dead end.
            #
            if not candidates:
                break

            candidates.sort(
                key=lambda candidate: candidate[0],
                reverse=True,
            )

            (
                _score,
                new_x,
                new_y,
                dx,
                dy,
            ) = candidates[0]

            branch_x = new_x
            branch_y = new_y

            previous_direction = (
                dx,
                dy,
            )

            walkable.add(
                (
                    branch_x,
                    branch_y,
                )
            )

            branch_cells.add(
                (
                    branch_x,
                    branch_y,
                )
            )

            #
            # Randomly stop branch generation
            # to create dead ends.
            #
            if (
                random.random()
                > branch_probability
            ):
                break

        #
        # Only keep branches that actually moved.
        #
        if len(branch_cells) > 1:
            branches.append(
                branch_cells
            )

    #
    # ------------------------------------------------------------
    # 3. Random nearby branch connections
    # ------------------------------------------------------------
    #

    connect_nearby_branches(
        walkable=walkable,
        branches=branches,
        connection_probability=connection_probability,
        max_connection_distance=max_connection_distance,
    )

    #
    # ------------------------------------------------------------
    # 4. Convert to JSON-compatible coordinates
    # ------------------------------------------------------------
    #

    return [
        [x, y]
        for x, y in sorted(
            walkable,
            key=lambda position: (
                position[1],
                position[0],
            ),
        )
    ]


def visualize_ascii(
    grid: list[Coordinate],
    length: int,
    width: int,
) -> None:
    """
    Terminal visualization.

    S = Start
    E = End
    . = Walkable
    # = Blocked
    """

    walkable = {
        (x, y)
        for x, y in grid
    }

    start = (
        0,
        0,
    )

    end = (
        length - 1,
        width - 1,
    )

    print()

    for y in range(width):

        row: list[str] = []

        for x in range(length):

            position = (
                x,
                y,
            )

            if position == start:
                row.append("S")

            elif position == end:
                row.append("E")

            elif position in walkable:
                row.append(".")

            else:
                row.append("#")

        print(
            " ".join(row)
        )

    print()


def visualize_matplotlib(
    grid: list[Coordinate],
    length: int,
    width: int,
) -> None:
    try:
        import matplotlib.pyplot as plt
        import numpy as np

    except ImportError as error:
        raise RuntimeError(
            "Visualization requires matplotlib and numpy.\n"
            "Install them with:\n"
            "pip install matplotlib numpy"
        ) from error

    #
    # 0 = blocked
    # 1 = walkable
    #
    matrix = np.zeros(
        (
            width,
            length,
        ),
        dtype=int,
    )

    for x, y in grid:
        matrix[y][x] = 1

    fig, ax = plt.subplots()

    ax.imshow(
        matrix,
        origin="upper",
        interpolation="none",
    )

    ax.scatter(
        0,
        0,
        marker="o",
        s=100,
        label="Start",
    )

    ax.scatter(
        length - 1,
        width - 1,
        marker="X",
        s=100,
        label="End",
    )

    ax.set_xticks(
        [
            x - 0.5
            for x in range(length + 1)
        ],
        minor=True,
    )

    ax.set_yticks(
        [
            y - 0.5
            for y in range(width + 1)
        ],
        minor=True,
    )

    ax.grid(
        which="minor",
        linewidth=0.5,
    )

    ax.tick_params(
        which="minor",
        bottom=False,
        left=False,
    )

    ax.set_title(
        f"5thSense Random Grid ({length} × {width})"
    )

    ax.set_xlabel("X")
    ax.set_ylabel("Y")

    ax.legend()

    plt.tight_layout()
    plt.show()


def main(
    args: Namespace,
) -> None:

    grid = generate_random_grid(
        length=args.length,
        width=args.width,
        branch_probability=args.branch_probability,
        max_branch_length=args.max_branch_length,
        branch_count=args.branch_count,
        connection_probability=args.connection_probability,
        max_connection_distance=args.max_connection_distance,
        min_branch_spacing=args.min_branch_spacing,
    )

    output = json.dumps(
        grid,
        separators=(
            ",",
            ":",
        ),
    )

    if args.output:

        with open(
            args.output,
            "w",
            encoding="utf-8",
        ) as file:
            file.write(
                output
            )

        print(
            f"Generated {len(grid)} walkable coordinates "
            f"and saved to {args.output}"
        )

    else:
        print(
            output
        )

    if args.visualize == "ascii":

        visualize_ascii(
            grid,
            args.length,
            args.width,
        )

    elif args.visualize == "gui":

        visualize_matplotlib(
            grid,
            args.length,
            args.width,
        )


if __name__ == "__main__":

    parser = ArgumentParser(
        prog="5thSense Random Grid Data Generator",
        description=(
            "Generate random grid data "
            "for 5thSense A* testing"
        ),
    )

    parser.add_argument(
        "-l",
        "--length",
        type=int,
        default=100,
        help=(
            "Length of the random grid "
            "(default: 100)"
        ),
    )

    parser.add_argument(
        "-w",
        "--width",
        type=int,
        default=100,
        help=(
            "Width of the random grid "
            "(default: 100)"
        ),
    )

    parser.add_argument(
        "-b",
        "--branch-probability",
        type=float,
        default=0.97,
        help=(
            "Probability that a branch continues "
            "(default: 0.97)"
        ),
    )

    parser.add_argument(
        "--branch-count",
        type=int,
        default=70,
        help=(
            "Number of random branches "
            "(default: 70)"
        ),
    )

    parser.add_argument(
        "--max-branch-length",
        type=int,
        default=80,
        help=(
            "Maximum branch length "
            "(default: 80)"
        ),
    )

    parser.add_argument(
        "--min-branch-spacing",
        type=int,
        default=5,
        help=(
            "Minimum spacing between separate paths "
            "(default: 5)"
        ),
    )

    parser.add_argument(
        "--connection-probability",
        type=float,
        default=0.20,
        help=(
            "Probability of connecting nearby branches "
            "(default: 0.20)"
        ),
    )

    parser.add_argument(
        "--max-connection-distance",
        type=int,
        default=10,
        help=(
            "Maximum Manhattan distance between branches "
            "for automatic connection "
            "(default: 10)"
        ),
    )

    parser.add_argument(
        "-o",
        "--output",
        type=str,
        help="Optional output JSON file",
    )

    parser.add_argument(
        "-v",
        "--visualize",
        choices=[
            "ascii",
            "gui",
        ],
        help="Visualize generated grid",
    )

    args: Namespace = (
        parser.parse_args()
    )

    main(args)