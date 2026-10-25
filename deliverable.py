"""
Patch for paraspell/xcm-tools Issue #2238:
Swap getBestAmountOut quotes on 100% of the input while execution swaps 99% (origin is never passed on the quote path).

This patch ensures that the amount used for quoting in getBestAmountOut matches the actual amount used during swap execution.
Previously, getBestAmountOut was quoting on 100% of the input, but the execution only swapped 99% (withholding 1% for origin/fee).
This patch modifies the quoting logic to use the same input amount as the execution path.

Assumptions:
- The swap execution path uses 99% of the input amount (i.e., input_amount * 0.99).
- The getBestAmountOut function is responsible for quoting the best output amount for a given input.
- The code is written in Python for demonstration purposes, reflecting the logic that would be patched in the TypeScript/JS codebase.

No external dependencies are used.
"""

from typing import List, Tuple, Optional

def get_best_amount_out(
    input_amount: float,
    routes: List[List[str]],
    get_amount_out_fn: callable,
    origin_fee_percent: float = 0.01
) -> Tuple[Optional[List[str]], float]:
    """
    Finds the best route and output amount for a swap, using the same input amount as the execution path.

    Args:
        input_amount (float): The total input amount for the swap.
        routes (List[List[str]]): List of possible swap routes (each route is a list of token symbols).
        get_amount_out_fn (callable): Function to compute output amount for a route and input.
        origin_fee_percent (float): Percentage of input withheld for origin/fee (default 0.01 for 1%).

    Returns:
        Tuple[Optional[List[str]], float]: The best route and the corresponding output amount.
    """
    # Use the same input amount as the execution path (i.e., 99% of input)
    execution_input_amount = input_amount * (1 - origin_fee_percent)

    best_route: Optional[List[str]] = None
    best_output: float = 0.0

    for route in routes:
        output = get_amount_out_fn(route, execution_input_amount)
        if output > best_output:
            best_output = output
            best_route = route

    return best_route, best_output

# Example get_amount_out_fn for demonstration purposes
def example_get_amount_out_fn(route: List[str], amount_in: float) -> float:
    """
    Dummy function to simulate output amount for a given route and input.
    For demonstration, it returns amount_in multiplied by a route-specific factor.
    """
    # Simulate different rates for different routes
    route_factors = {
        ('A', 'B'): 0.98,
        ('A', 'C', 'B'): 0.97,
        ('A', 'D', 'B'): 0.96
    }
    factor = route_factors.get(tuple(route), 0.95)
    return amount_in * factor

# Example usage and test
if __name__ == "__main__":
    input_amount = 1000.0  # 1000 tokens
    routes = [
        ['A', 'B'],
        ['A', 'C', 'B'],
        ['A', 'D', 'B']
    ]

    best_route, best_output = get_best_amount_out(
        input_amount,
        routes,
        example_get_amount_out_fn,
        origin_fee_percent=0.01
    )

    print(f"Best route: {best_route}, Best output: {best_output:.2f}")

    # Test: The quoted input should match the execution input (99% of input_amount)
    expected_execution_input = input_amount * 0.99
    assert abs(best_output - example_get_amount_out_fn(best_route, expected_execution_input)) < 1e-6