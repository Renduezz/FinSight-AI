FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts

# Genera el modelo de prueba durante la construcción de la imagen, ya que
# Render no conserva archivos entre despliegues (almacenamiento efímero) —
# así el modelo siempre existe cuando el contenedor arranca.
RUN python scripts/create_dummy_model.py

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]