@echo off
cd /d "C:\Users\Christopher Rosario\Documents\Projects\SOFTWARE_DEVELOPMENT_PROJECTS\ELECSCAN ENTERPRISE"
echo === Verificando git ===
git --version || (echo Git no instalado & pause & exit /b 1)

echo === Inicializando repo (si no existe) ===
if not exist .git (
  git init -b main
)

echo === Configurando remote ===
git remote remove origin 2>nul
git remote add origin https://github.com/Christ-m18/ElecScan-Enterprise.git

echo === Stage y commit ===
git add .
git diff --cached --quiet && (echo Sin cambios para commitear) || (git commit -m "chore: bootstrap ELECSCAN Enterprise M0")

echo === Push ===
git branch -M main
git push -u origin main

echo.
echo === Resultado ===
echo Push completado a https://github.com/Christ-m18/ElecScan-Enterprise
pause
