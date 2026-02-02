@echo off
echo ===============================
echo 🔧 Building frontend...
echo ===============================
cd frontend
npm run build
@REM if %errorlevel% neq 0 (
@REM     echo ❌ Frontend build failed!
@REM     exit /b %errorlevel%
@REM )
cd ..

echo.
echo ===============================
echo 📁 Copying build to backend/wwwroot...
echo ===============================
xcopy "frontend\build\*" "back-end\back-end\wwwroot\" /E /Y /D /I
if %errorlevel% neq 0 (
    echo ❌ Copy failed!
    exit /b %errorlevel%
)

echo.
echo ===============================
echo 🚀 Publishing .NET app...
echo ===============================
cd back-end\back-end
dotnet publish -o publish
if %errorlevel% neq 0 (
    echo ❌ .NET publish failed!
    exit /b %errorlevel%
)

echo.
echo ===============================
echo ✅ Publish completed successfully!
echo ===============================
pause