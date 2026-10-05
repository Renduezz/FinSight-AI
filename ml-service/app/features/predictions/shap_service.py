
import shap
import pandas as pd
from app.features.predictions.schemas import ShapFactor

# Cuántos factores mostrar en el dashboard. Mostrar los 9 features
# completos saturaría el gráfico; nos quedamos con los que más pesan.
TOP_N_FACTORS = 5


def explain_prediction(model, feature_row: pd.DataFrame) -> list[ShapFactor]:

    explainer = shap.TreeExplainer(model)

    # shap_values tiene forma (1, n_features) para el caso de un modelo
    # de salida binaria/regresión simple. shap_values[0] = valores para
    # nuestra única fila (una empresa).
    shap_values = explainer.shap_values(feature_row)

    # Algunos modelos (ej. clasificadores binarios) devuelven una lista
    # con un array por clase. Nos interesa la clase positiva (índice 1 = "riesgo").
    if isinstance(shap_values, list):
        shap_values_row = shap_values[1][0]
    else:
        shap_values_row = shap_values[0]

    factors = [
        ShapFactor(
            feature=feature_name,
            impact=float(shap_values_row[i]),
            value=float(feature_row.iloc[0, i]),
        )
        for i, feature_name in enumerate(feature_row.columns)
    ]

    # Ordenamos por magnitud del impacto (sin importar si suma o resta riesgo),
    # porque al usuario de negocio le interesa saber CUÁLES variables
    # dominan la decisión, no solo las que aumentan el riesgo.
    factors.sort(key=lambda f: abs(f.impact), reverse=True)

    return factors[:TOP_N_FACTORS]
