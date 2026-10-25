"""
Patch for paraspell/xcm-tools issue #2236:
Plain-symbol ".e" asset lookups skip the DuplicateAssetError guard and silently pick the first match.

This module provides a patched asset lookup function that ensures DuplicateAssetError
is raised if multiple assets match a plain-symbol (e.g., ".e") lookup, instead of
silently picking the first match.

Assumptions:
- There is an AssetRegistry class with a lookup_asset_by_symbol method.
- There is a DuplicateAssetError exception.
- The registry stores assets in a list/dict with 'symbol' as a key or attribute.

This patch replaces the plain-symbol lookup logic to enforce the DuplicateAssetError guard.

Usage:
- Replace the original lookup_asset_by_symbol with patched_lookup_asset_by_symbol.
"""

from typing import Any, Dict, List, Optional


class DuplicateAssetError(Exception):
    """Raised when multiple assets match a plain-symbol lookup."""
    pass


class Asset:
    """
    Example Asset class.
    In actual usage, this would be the asset representation used in xcm-tools.
    """
    def __init__(self, symbol: str, data: Any) -> None:
        self.symbol = symbol
        self.data = data

    def __repr__(self) -> str:
        return f"Asset(symbol={self.symbol!r}, data={self.data!r})"


class AssetRegistry:
    """
    Example AssetRegistry class.
    In actual usage, this would be the registry used in xcm-tools.
    """
    def __init__(self) -> None:
        self._assets: List[Asset] = []

    def add_asset(self, asset: Asset) -> None:
        self._assets.append(asset)

    def lookup_asset_by_symbol(self, symbol: str) -> Optional[Asset]:
        """
        Looks up an asset by its symbol.
        If multiple assets match a plain-symbol (e.g., ".e"), raise DuplicateAssetError.
        If no asset matches, return None.
        """
        # Plain-symbol lookup: symbol starts with '.' and has no other qualifiers
        if symbol.startswith('.') and symbol.count('.') == 1:
            matches = [asset for asset in self._assets if asset.symbol == symbol]
            if len(matches) > 1:
                raise DuplicateAssetError(
                    f"Multiple assets found for plain-symbol '{symbol}': {matches}"
                )
            if matches:
                return matches[0]
            return None
        # Non-plain-symbol lookup (fallback to original logic)
        for asset in self._assets:
            if asset.symbol == symbol:
                return asset
        return None


# Example test cases to verify the patch
def _test_patch() -> None:
    registry = AssetRegistry()
    asset1 = Asset('.e', {'id': 1})
    asset2 = Asset('.e', {'id': 2})
    asset3 = Asset('.f', {'id': 3})
    registry.add_asset(asset1)
    registry.add_asset(asset2)
    registry.add_asset(asset3)

    # Should raise DuplicateAssetError for '.e'
    try:
        registry.lookup_asset_by_symbol('.e')
    except DuplicateAssetError as e:
        print("DuplicateAssetError correctly raised:", e)
    else:
        print("ERROR: DuplicateAssetError not raised for duplicate plain-symbol.")

    # Should return asset3 for '.f'
    result = registry.lookup_asset_by_symbol('.f')
    assert result == asset3, "Failed to lookup unique asset by symbol"

    # Should return None for '.g'
    result = registry.lookup_asset_by_symbol('.g')
    assert result is None, "Failed to return None for missing asset"

    # Remove one '.e' and test again
    registry._assets = [asset1, asset3]
    result = registry.lookup_asset_by_symbol('.e')
    assert result == asset1, "Failed to lookup single plain-symbol asset"

    print("All tests passed.")


if __name__ == "__main__":
    _test_patch()