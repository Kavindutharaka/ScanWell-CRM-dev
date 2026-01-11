@echo off
echo ===============================
echo 🔧 Building frontend...
echo ===============================
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed!
    exit /b %errorlevel%
)
cd ..

echo.
echo ===============================
echo 📁 Copying build to backend/wwwroot...
echo ===============================
xcopy "frontend\build\*" "back-end\back-end\wwwroot\" /E /Y /D /I

rem /E = copy subfolders
rem /Y = overwrite without asking
rem /D = only copy newer files
rem /I = assume destination is a folder

echo.
echo ===============================
echo 🚀 Publishing .NET app...
echo ===============================
cd back-end\back-end
dotnet publish -o "..\publish"
if %errorlevel% neq 0 (
    echo ❌ .NET publish failed!
    exit /b %errorlevel%
)

echo.
echo ===============================
echo ✅ Publish completed successfully!
echo ===============================
pause
