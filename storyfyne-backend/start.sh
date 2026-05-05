#!/bin/bash
set -e
echo "=== StoryFyne Startup ==="
echo "PWD: $(pwd)"
echo "PORT: $PORT"
echo "Python: $(which python)"
echo "Files: $(ls -la)"
echo "========================="
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info
