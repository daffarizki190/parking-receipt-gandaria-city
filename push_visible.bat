@echo off
echo =======================================================
echo          MENGUPLOAD KODE KE GITHUB SECARA VISUAL
echo =======================================================
echo.
echo Ganti ke cabang utama (main)...
call git switch main
echo Memasukkan desain baru ke cabang utama...
call git merge Upgrade_ke_react
echo.
echo =======================================================
echo SEDANG MENG-UPLOAD KE GITHUB (VERCEL)...
echo.
echo --- PERHATIAN ---
echo JIKA MUNCUL JENDELA POPUP GITHUB, SILAKAN LOGIN
echo =======================================================
call git push origin main
echo.
echo PROSES SELESAI!
echo Jika sukses (muncul 100%%), Vercel akan terupdate dalam 30 detik.
echo Silakan tutup jendela ini.
pause
