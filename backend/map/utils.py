import heapq

from django.views.static import directory_index


def heuristic(node, target):
    # Estimating the distance between two coordinates
    return abs(node[0] - target[0]) + abs(node[1] - target[1])

def find_shortest_path(grid_data, start, end):
    # Find the shortest path from a given start point and a target using A* algorithm

    # Convert grid data to a set of tuples
    accessible_cells = set(tuple(cell) for cell in grid_data)

    start = tuple(start)
    end = tuple(end)

    # Make sure that the start and end points are in accessible cells
    if start not in accessible_cells:
        return {'error','The start coordinate is not accessible'}
    if end not in accessible_cells:
        return {'error','The end coordinate is not accessible'}

    open_set = []
    # Prioritise the start coordinate
    heapq.heappush(open_set, (0, start))

    came_from = {}

    # Cost from start to current node
    g_score = {start: 0}
    # Total estimated cost
    f_score = {start: heuristic(start, end)}

    # A person may move forward, backward, left or right
    directions = [(0,1),(0,-1),(1,0),(-1,0)]

    while open_set:
        # Unpack the value and save the coordinate only
        _, current = heapq.heappop(open_set)

        if current == end:
            path = []
            while current in came_from:
                path.append(list(current))
                current = came_from[current]
            path.append(list(start))
            # Reverse the path to return the path that starts from the starting point and ends at the ending point
            return path[::1]

        # Exploring the neighbouring cells
        for dx,dy in directions:
            neighbour = (current[0] + dx, current[1] + dy)
            if neighbour not in accessible_cells:
                continue

            tentative_g_score = g_score[current] + 1
            # If the neighbouring cell has not been visited or this is a path that we found faster, proceed
            if neighbour not in g_score or tentative_g_score < g_score[neighbour]:
                came_from[neighbour] = current
                g_score[neighbour] = tentative_g_score
                f_score[neighbour] = tentative_g_score + heuristic(neighbour, end)
                heapq.heappush(open_set, (f_score[neighbour], neighbour))

    return {'error','No valid path found'}