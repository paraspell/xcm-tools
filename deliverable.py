from typing import Optional

def verify_ed_on_destination(
    recipient_balance: int,
    transfer_amount: int,
    existential_deposit: int
) -> bool:
    """
    Verifies if, after a transfer, the recipient's balance will be above the existential deposit.
    Returns True if the resulting balance is strictly greater than the existential deposit.
    Returns False if the resulting balance is less than or equal to the existential deposit.

    Args:
        recipient_balance (int): The current balance of the recipient.
        transfer_amount (int): The amount to be transferred.
        existential_deposit (int): The existential deposit threshold.

    Returns:
        bool: True if resulting balance > existential_deposit, else False.
    """
    if recipient_balance < 0 or transfer_amount < 0 or existential_deposit < 0:
        raise ValueError("All input values must be non-negative integers.")

    resulting_balance = recipient_balance + transfer_amount
    # Must be strictly greater than existential deposit
    return resulting_balance > existential_deposit


def test_verify_ed_on_destination() -> None:
    """
    Unit tests for verify_ed_on_destination.
    """
    # Case: resulting balance less than existential deposit
    assert verify_ed_on_destination(1, 1, 5) is False

    # Case: resulting balance exactly equal to existential deposit
    assert verify_ed_on_destination(2, 3, 5) is False

    # Case: resulting balance greater than existential deposit
    assert verify_ed_on_destination(3, 3, 5) is True

    # Case: zero balances and zero existential deposit
    assert verify_ed_on_destination(0, 0, 0) is False

    # Case: negative input should raise ValueError
    try:
        verify_ed_on_destination(-1, 1, 1)
        assert False, "Expected ValueError"
    except ValueError:
        pass

    try:
        verify_ed_on_destination(1, -1, 1)
        assert False, "Expected ValueError"
    except ValueError:
        pass

    try:
        verify_ed_on_destination(1, 1, -1)
        assert False, "Expected ValueError"
    except ValueError:
        pass

if __name__ == "__main__":
    test_verify_ed_on_destination()