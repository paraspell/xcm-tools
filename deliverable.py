"""
Patch for paraspell/xcm-tools issue #2235:
Fixes silent truncation and incorrect rounding of fractional amounts when the resolved asset has zero decimals.

This module provides a function to correctly handle asset amount conversion when the asset has zero decimals,
ensuring that fractional amounts are properly rounded and small amounts are not incorrectly raised to 2.

Assumptions:
- The function `convert_amount` is the core logic for converting a user-specified amount to the asset's base units,
  given the asset's decimals.
- If decimals == 0, the amount must be an integer, and fractional values are rounded to the nearest integer.
- If the rounded amount is zero, it remains zero (no forced minimum of 2).
"""

from typing import Union

def convert_amount(amount: Union[float, int], decimals: int) -> int:
    """
    Converts a user-specified amount to the asset's base units, handling zero-decimal assets correctly.

    Args:
        amount (Union[float, int]): The user-specified amount (may be fractional).
        decimals (int): The number of decimals the asset supports.

    Returns:
        int: The amount in base units, properly rounded for zero-decimal assets.

    Raises:
        ValueError: If the amount is negative or decimals is negative.
    """
    if decimals < 0:
        raise ValueError("Decimals cannot be negative")
    if amount < 0:
        raise ValueError("Amount cannot be negative")

    if decimals == 0:
        # Properly round to nearest integer for zero-decimal assets
        base_amount = int(round(amount))
    else:
        base_amount = int(round(amount * (10 ** decimals)))

    return base_amount

# --- TESTS ---

def _test():
    # Zero decimals, fractional amounts
    assert convert_amount(1.7, 0) == 2
    assert convert_amount(1.2, 0) == 1
    assert convert_amount(0.4, 0) == 0
    assert convert_amount(0.5, 0) == 0  # Python round(0.5) == 0 (bankers rounding)
    assert convert_amount(1.5, 0) == 2
    assert convert_amount(2, 0) == 2
    assert convert_amount(0, 0) == 0

    # Zero decimals, small amounts
    assert convert_amount(0.9, 0) == 1
    assert convert_amount(0.1, 0) == 0

    # Nonzero decimals
    assert convert_amount(1.234, 3) == 1234
    assert convert_amount(0.0004, 3) == 0
    assert convert_amount(0.0005, 3) == 1
    assert convert_amount(2, 2) == 200

    # Negative values
    try:
        convert_amount(-1, 0)
        assert False, "Negative amount did not raise"
    except ValueError:
        pass

    try:
        convert_amount(1, -1)
        assert False, "Negative decimals did not raise"
    except ValueError:
        pass

if __name__ == "__main__":
    _test()