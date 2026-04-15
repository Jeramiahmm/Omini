"""Route optimization service using Google OR-Tools.

Solves a single-vehicle Travelling Salesman Problem (TSP) to find the
shortest route visiting all stops. Uses haversine distance for the cost
matrix and OR-Tools' guided local search metaheuristic for improvement.
"""

import math

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

# Average urban trash-collection driving speed: 30 km/h
AVERAGE_SPEED_MPS = 30 * 1000 / 3600  # ~8.33 m/s


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the great-circle distance in meters between two points."""
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    )
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def build_distance_matrix(
    coords: list[tuple[float, float]],
) -> list[list[int]]:
    """Build a symmetric NxN distance matrix (integer meters).

    Only computes the upper triangle since haversine is symmetric.
    """
    n = len(coords)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            d = int(
                haversine(coords[i][0], coords[i][1], coords[j][0], coords[j][1])
            )
            matrix[i][j] = d
            matrix[j][i] = d
    return matrix


def _time_limit_for_n(n: int) -> int:
    """Adaptive solver time limit in seconds based on stop count."""
    if n <= 200:
        return 1
    return 2


def solve_route(stops_input: list) -> dict:
    """Solve a single-vehicle TSP for the given stops.

    Args:
        stops_input: list of StopInput objects with id, lat, lng attributes.

    Returns:
        dict with keys:
          - route: list of stop IDs in optimal visit order
          - distance: total route distance in meters
          - duration: estimated duration in seconds (at 30 km/h avg)

    Raises:
        ValueError: if OR-Tools cannot find a solution.
    """
    coords = [(s.lat, s.lng) for s in stops_input]
    stop_ids = [s.id for s in stops_input]
    n = len(coords)

    distance_matrix = build_distance_matrix(coords)

    # OR-Tools setup: n nodes, 1 vehicle, depot at index 0
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Search parameters: greedy initial solution + guided local search
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.FromSeconds(_time_limit_for_n(n))

    solution = routing.SolveWithParameters(search_params)
    if not solution:
        raise ValueError("OR-Tools could not find a solution for the given stops")

    # Extract the ordered route
    ordered_ids = []
    total_distance = 0
    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        ordered_ids.append(stop_ids[node])
        next_index = solution.Value(routing.NextVar(index))
        next_node = manager.IndexToNode(next_index)
        total_distance += distance_matrix[node][next_node]
        index = next_index

    total_duration = total_distance / AVERAGE_SPEED_MPS

    return {
        "route": ordered_ids,
        "distance": round(total_distance, 2),
        "duration": round(total_duration, 2),
    }
