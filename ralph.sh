#!/bin/bash
# Ralph Loop Boilerplate (Autonomous AI Agent Loop)
# Usage: ./ralph.sh

echo "🚀 Starting Ralph Loop..."

# Ensure we have our task instructions
if [ ! -f prd.md ]; then
  echo "Error: prd.md not found. Creating a blank one..."
  echo "# Product Requirements Document" > prd.md
fi

LOOP_COUNT=0
MAX_LOOPS=10

while [ $LOOP_COUNT -lt $MAX_LOOPS ]; do
  LOOP_COUNT=$((LOOP_COUNT+1))
  echo "🔁 [Loop $LOOP_COUNT of $MAX_LOOPS]"
  
  # =======================================================
  # REPLACE THIS LINE with your CLI AI Agent of choice
  # Example 1: claude -p "Read prd.md and execute the next task."
  # Example 2: aider --message "Read prd.md. Do the next undocumented task."
  # =======================================================
  echo "AI Agent is thinking... (Please add your agent command in ralph.sh)"
  
  # Wait for user input or auto-verification
  read -p "Did the AI finish the task successfully? [y/N]: " choice
  case "$choice" in 
    y|Y ) 
      echo "✅ Task marked as complete!"
      break
      ;;
    * )
      echo "❌ Task not complete or tests failed. Restarting loop..."
      ;;
  esac
done

echo "🏁 Ralph Loop finished."
