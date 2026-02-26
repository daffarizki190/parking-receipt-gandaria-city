@echo off
echo =======================================================
echo          MEMBANGUN APLIKASI REACT (VITE)
echo =======================================================
echo.
call npm run build
echo.
echo Jika berhasil, folder "dist" akan terbuka otomatis.
echo Silakan seret folder "dist" tersebut ke website Netlify.
pause
explorer dist
start https://app.netlify.com/drop
