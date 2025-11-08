"""
Structured logging configuration for the application.
Logs include ISO timestamp, level, module, and message.
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs structured log messages."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with structured fields."""
        timestamp = datetime.utcnow().isoformat() + "Z"
        level = record.levelname
        module = record.name
        message = record.getMessage()

        # Build structured log entry
        log_entry = f"{timestamp} | {level:8s} | {module:30s} | {message}"

        # Add exception info if present
        if record.exc_info:
            log_entry += "\n" + self.formatException(record.exc_info)

        return log_entry


def setup_logging(
    log_level: str = "INFO", log_file: str = "logs/app.log"
) -> logging.Logger:
    """
    Configure application logging with both file and console handlers.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file

    Returns:
        Configured logger instance
    """
    # Create logs directory if it doesn't exist
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    # Create logger
    logger = logging.getLogger("app")
    logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()

    # Create formatter
    formatter = StructuredFormatter()

    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper()))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler
    file_handler = logging.FileHandler(log_file, mode="a")
    file_handler.setLevel(getattr(logging, log_level.upper()))
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


# Initialize logger
logger = logging.getLogger("app")
