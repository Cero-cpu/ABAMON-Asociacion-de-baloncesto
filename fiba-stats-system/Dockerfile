# Etapa 1: Build del Frontend
FROM node:20-alpine as build-frontend

WORKDIR /app/frontend

# Copiar configuración de dependencias e instalar
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copiar el resto del código del frontend y construir (Vite)
COPY frontend/ ./
RUN npm run build


# Etapa 2: Configurar el Backend (FastAPI) y unir todo
FROM python:3.11-slim

WORKDIR /app

# Configurar variables de entorno requeridas para Python y FastAPI
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=80

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar dependencias de Python e instalar
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copiar el código del backend
COPY backend/ ./backend/

# Copiar los archivos estáticos construidos desde la etapa 1
# app.py espera encontrar los archivos en /app/frontend/dist
COPY --from=build-frontend /app/frontend/dist /app/frontend/dist

# Exponer el puerto
EXPOSE 80

# Comando para iniciar Uvicorn sirviendo el backend (y el frontend estático)
CMD ["uvicorn", "backend.app.app:app", "--host", "0.0.0.0", "--port", "80"]
