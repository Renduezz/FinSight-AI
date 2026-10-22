import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from app.utils.metrics import compute_accuracy, compute_feature_importances
from app.utils.validators import validate_no_missing_values, validate_minimum_class_balance
from datetime import datetime

GB_HYPERPARAMETERS = {
    "n_estimators": 150,
    "learning_rate": 0.1,
    "max_depth": 3,
    "random_state": 42,
}
TEST_SIZE = 0.2


def train_gradient_boosting(X: pd.DataFrame, y: pd.Series):
    validate_no_missing_values(X)
    validate_minimum_class_balance(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size= TEST_SIZE,
        stratify= y,
        random_state=GB_HYPERPARAMETERS["random_state"],
    )

    model = GradientBoostingClassifier(**GB_HYPERPARAMETERS)
    model.fit(X_train, y_train)

    train_accuracy = compute_accuracy(y_train, model.predict(X_train))
    test_accuracy = compute_accuracy(y_test, model.predict(X_test))
    feature_importances = compute_feature_importances(model, list(X.columns))

    metrics = {
        "n_samples": len(X),
        "train_accuracy": train_accuracy,
        "test_accuracy": test_accuracy,
        "feature_importances": feature_importances,
        "trained_at": datetime.now(),
    }
    return model, metrics