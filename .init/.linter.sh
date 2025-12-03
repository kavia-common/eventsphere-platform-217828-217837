#!/bin/bash
cd /home/kavia/workspace/code-generation/eventsphere-platform-217828-217837/frontend_react_tailwind_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

