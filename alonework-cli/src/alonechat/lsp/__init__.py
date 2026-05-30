"""
LSP模块 / LSP Module

CLI LSP集成
CLI LSP integration
"""

from .integration import (
    CLILSPIntegration,
    display_diagnostics,
    display_diagnostics_summary,
    format_diagnostic_for_context,
)

__all__ = [
    "CLILSPIntegration",
    "display_diagnostics",
    "display_diagnostics_summary",
    "format_diagnostic_for_context",
]
