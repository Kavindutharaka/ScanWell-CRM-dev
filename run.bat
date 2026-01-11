@echo off
start cmd /k "cd frontend && npm run start"
start cmd /k "cd back-end\back-end && dotnet watch"