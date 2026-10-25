import shap #esta libreria hace el calculo matematico
import pandas as pd
from app.features.predictions.schemas import ShapFactor


TOP_N_FACTORS = 9

def explain_prediction(model, feature_row: pd.DataFrame) -> list[ShapFactor]:
  #para usar la libreria shap
  explainer = shap.TreeExplainer(model) #crea explicaciones basadas en el modelo de arboles (gradient boost)
  shap_values = explainer.shap_values(feature_row) #luego de que el modelo este cargado, calcula los valores de impacto

  if isinstance(shap_values, list):
    shap_values_row = shap_values[1][0]
  else:
    shap_values_row = shap_values[0]


  factors = [
    ShapFactor(
        feature=nombre_columna,
        impact=float(shap_values_row[i]),
        value=float(feature_row.iloc[0, i]),
    )
    for i, nombre_columna in enumerate(feature_row.columns)
    ]
    
  factors.sort(key=lambda f: abs(f.impact), reverse=True)
  return factors[:TOP_N_FACTORS]
