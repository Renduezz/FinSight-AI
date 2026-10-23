FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts
COPY data ./data

# Genera el modelo por defecto durante la construccion de la imagen, ya que
# Render no conserva archivos entre despliegues (almacenamiento efimero) -
# asi el modelo siempre existe cuando el contenedor arranca. Se entrena con
# los datos sinteticos preparados para el modelo por defecto, usando el mismo
# pipeline que el endpoint /training/train.
RUN python scripts/train_default_model.py

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]