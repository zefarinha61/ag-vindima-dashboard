@echo off
echo ==========================================
echo Iniciando Projeto AG_Vindima - Rececao Uvas
echo ==========================================

echo Iniciando Backend...
cd c:\Server\ACP\AG_Vindima\backend
start cmd /k "npm start"

echo Aguardando 3 segundos...
timeout /t 3 /nobreak > nul

echo Iniciando Frontend...
cd c:\Server\ACP\AG_Vindima\frontend
start cmd /k "npm run dev"

echo Aplicação iniciada!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
pause
