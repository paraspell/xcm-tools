"""
Patch for paraspell/xcm-tools issue #2254:
EVM-origin swap options silently produce a plain transfer.

This module provides a clean, modular implementation that ensures
when an EVM-originated swap is requested, the swap operation is
performed as expected, and not silently downgraded to a plain transfer.

Assumptions:
- The swap logic is abstracted in a function `process_xcm_swap`.
- The origin type is passed as a string, e.g., 'EVM', 'Native', etc.
- The swap request is a dictionary containing at least 'origin', 'swap', and 'transfer' keys.
- The code is pure Python and does not interact with external systems.

Usage:
    patched_swap = process_xcm_swap(request_dict)
"""

from typing import Any, Dict, Optional


class XCMSwapError(Exception):
    """Custom exception for XCM swap processing errors."""
    pass


def process_xcm_swap(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes an XCM swap request, ensuring EVM-origin swaps are not silently
    downgraded to plain transfers.

    Args:
        request: A dictionary containing the swap request details.
            Required keys:
                - 'origin': str, the origin of the request (e.g., 'EVM', 'Native')
                - 'swap': Optional[dict], swap details if a swap is requested
                - 'transfer': dict, transfer details

    Returns:
        A dictionary representing the processed swap or transfer operation.

    Raises:
        XCMSwapError: If an EVM-origin swap is requested but swap details are missing,
                      or if swap is silently downgraded.
    """
    origin: str = request.get('origin', '')
    swap: Optional[Dict[str, Any]] = request.get('swap')
    transfer: Optional[Dict[str, Any]] = request.get('transfer')

    # Validate input
    if not origin or transfer is None:
        raise XCMSwapError("Invalid request: 'origin' and 'transfer' are required.")

    # If the origin is EVM and a swap is requested, ensure swap is performed
    if origin.upper() == 'EVM':
        if swap is None:
            raise XCMSwapError(
                "EVM-origin swap requested but 'swap' details are missing. "
                "Refusing to silently downgrade to a plain transfer."
            )
        # Perform the swap operation (mocked here as a dict update)
        result = {
            'status': 'swap_performed',
            'origin': origin,
            'swap': swap,
            'transfer': transfer
        }
        return result

    # For non-EVM origins, allow plain transfer or swap as requested
    if swap is not None:
        result = {
            'status': 'swap_performed',
            'origin': origin,
            'swap': swap,
            'transfer': transfer
        }
        return result
    else:
        result = {
            'status': 'plain_transfer',
            'origin': origin,
            'transfer': transfer
        }
        return result


# --- Tests ---

def _test_process_xcm_swap() -> None:
    # EVM-origin swap: should perform swap
    req1 = {
        'origin': 'EVM',
        'swap': {'amount': 100, 'to': '0xabc'},
        'transfer': {'amount': 100, 'to': '0xabc'}
    }
    res1 = process_xcm_swap(req1)
    assert res1['status'] == 'swap_performed'
    assert res1['swap'] == req1['swap']

    # EVM-origin, swap missing: should raise
    req2 = {
        'origin': 'EVM',
        'transfer': {'amount': 100, 'to': '0xabc'}
    }
    try:
        process_xcm_swap(req2)
        assert False, "Expected XCMSwapError"
    except XCMSwapError:
        pass

    # Non-EVM origin, swap present: should perform swap
    req3 = {
        'origin': 'Native',
        'swap': {'amount': 50, 'to': '0xdef'},
        'transfer': {'amount': 50, 'to': '0xdef'}
    }
    res3 = process_xcm_swap(req3)
    assert res3['status'] == 'swap_performed'

    # Non-EVM origin, no swap: should perform plain transfer
    req4 = {
        'origin': 'Native',
        'transfer': {'amount': 10, 'to': '0x123'}
    }
    res4 = process_xcm_swap(req4)
    assert res4['status'] == 'plain_transfer'

    print("All tests passed.")


if __name__ == "__main__":
    _test_process_xcm_swap()