"""
benchmark/models/baselines.py
------------------------------
Standardized Suite of 8 Model Baselines for PARAKH Procurement Risk Evaluation:
1. Majority Classifier
2. Random Classifier
3. Logistic Regression (L2 + Scaler)
4. Random Forest (Class-Weighted)
5. HistGradientBoostingClassifier
6. Isolation Forest (7D Standardized)
7. PARAKH Rule-Based Screening Engine
8. Hybrid PARAKH (Weighted Rules + ML Outlier Ensemble)
"""

import os
import sys
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, brier_score_loss, confusion_matrix
)

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)


class PARAKHRuleClassifier(BaseEstimator, ClassifierMixin):
    """Deterministic heuristic screening model based on RF-1 to RF-8 triggers."""
    
    def __init__(self, threshold: float = 30.0):
        self.threshold = threshold

    def fit(self, X, y=None):
        return self

    def predict_proba(self, X):
        # Expects X to have rule_score or compute heuristic index
        scores = X[:, 0] if X.ndim > 1 else X
        probs_pos = np.clip(scores / 100.0, 0.0, 1.0)
        probs_neg = 1.0 - probs_pos
        return np.column_stack([probs_neg, probs_pos])

    def predict(self, X):
        scores = X[:, 0] if X.ndim > 1 else X
        return (scores >= self.threshold).astype(int)


class StandardizedIsolationForest(BaseEstimator, ClassifierMixin):
    """Unsupervised Isolation Forest wrapped with feature scaling and percentile anomaly ranking."""
    
    def __init__(self, n_estimators: int = 100, contamination: float = 0.10, random_state: int = 42):
        self.n_estimators = n_estimators
        self.contamination = contamination
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.model = IsolationForest(n_estimators=self.n_estimators, contamination=self.contamination, random_state=self.random_state)
        self.threshold_score_ = 0.50

    def fit(self, X, y=None):
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        raw_scores = -self.model.decision_function(X_scaled)
        self.min_score_ = raw_scores.min()
        self.max_score_ = raw_scores.max()
        return self

    def predict_proba(self, X):
        X_scaled = self.scaler.transform(X)
        raw = -self.model.decision_function(X_scaled)
        rng = (self.max_score_ - self.min_score_) if (self.max_score_ > self.min_score_) else 1.0
        norm_scores = np.clip((raw - self.min_score_) / rng, 0.0, 1.0)
        return np.column_stack([1.0 - norm_scores, norm_scores])

    def predict(self, X):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= self.threshold_score_).astype(int)


class HybridPARAKHClassifier(BaseEstimator, ClassifierMixin):
    """
    Composite Architecture:
    CRS = (0.75 * Normalized_Rule_Score) + (0.25 * Scaled_ML_Anomaly_Score)
    """
    
    def __init__(self, rule_weight: float = 0.75, ml_weight: float = 0.25, threshold: float = 40.0, random_state: int = 42):
        self.rule_weight = rule_weight
        self.ml_weight = ml_weight
        self.threshold = threshold
        self.random_state = random_state
        self.ml_model = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=random_state)
        self.scaler = StandardScaler()

    def fit(self, X, y):
        # X[:, 0] is rule score, X[:, 1:] are raw feature dimensions
        X_features = X[:, 1:]
        X_scaled = self.scaler.fit_transform(X_features)
        self.ml_model.fit(X_scaled, y)
        return self

    def predict_proba(self, X):
        rule_scores = X[:, 0] / 100.0
        X_features = X[:, 1:]
        X_scaled = self.scaler.transform(X_features)
        ml_probs = self.ml_model.predict_proba(X_scaled)[:, 1]
        
        composite_probs = (self.rule_weight * rule_scores) + (self.ml_weight * ml_probs)
        composite_probs = np.clip(composite_probs, 0.0, 1.0)
        return np.column_stack([1.0 - composite_probs, composite_probs])

    def predict(self, X):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= (self.threshold / 100.0)).astype(int)


def build_model_suite(random_state: int = 42) -> Dict[str, Any]:
    """Instantiate the 8 baseline models."""
    return {
        "Majority Baseline": DummyClassifier(strategy="most_frequent"),
        "Random Baseline": DummyClassifier(strategy="uniform", random_state=random_state),
        "Logistic Regression (L2)": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=random_state),
        "Random Forest": RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=random_state),
        "Gradient Boosting (Hist)": HistGradientBoostingClassifier(random_state=random_state),
        "Isolation Forest (Unsupervised)": StandardizedIsolationForest(random_state=random_state),
        "PARAKH Rule-Based Engine": PARAKHRuleClassifier(threshold=30.0),
        "Hybrid PARAKH (Rules + ML)": HybridPARAKHClassifier(threshold=35.0, random_state=random_state)
    }


def compute_classification_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: Optional[np.ndarray] = None) -> Dict[str, float]:
    """Compute comprehensive classification metrics."""
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    acc = (tp + tn) / max(1, len(y_true))
    
    roc_auc = None
    pr_auc = None
    brier = None

    if y_prob is not None and len(np.unique(y_true)) > 1:
        try:
            roc_auc = roc_auc_score(y_true, y_prob)
            pr_auc = average_precision_score(y_true, y_prob)
            brier = brier_score_loss(y_true, y_prob)
        except Exception:
            pass

    return {
        "precision": float(prec),
        "recall": float(rec),
        "f1": float(f1),
        "accuracy": float(acc),
        "roc_auc": float(roc_auc) if roc_auc is not None else -1.0,
        "pr_auc": float(pr_auc) if pr_auc is not None else -1.0,
        "brier_score": float(brier) if brier is not None else -1.0,
        "tp": tp, "fp": fp, "tn": tn, "fn": fn,
        "total_samples": len(y_true)
    }


def bootstrap_confidence_intervals(y_true: np.ndarray, y_pred: np.ndarray, y_prob: Optional[np.ndarray] = None, n_bootstraps: int = 500, alpha: float = 0.05) -> Dict[str, Tuple[float, float]]:
    """Compute 95% bootstrap confidence intervals for Precision, Recall, and F1."""
    rng = np.random.RandomState(42)
    prec_list = []
    rec_list = []
    f1_list = []
    
    n = len(y_true)
    for _ in range(n_bootstraps):
        idxs = rng.randint(0, n, size=n)
        yt_b = y_true[idxs]
        yp_b = y_pred[idxs]
        
        prec_list.append(precision_score(yt_b, yp_b, zero_division=0))
        rec_list.append(recall_score(yt_b, yp_b, zero_division=0))
        f1_list.append(f1_score(yt_b, yp_b, zero_division=0))

    lower_p = (alpha / 2.0) * 100
    upper_p = (1.0 - alpha / 2.0) * 100

    return {
        "precision_95_ci": (round(float(np.percentile(prec_list, lower_p)), 4), round(float(np.percentile(prec_list, upper_p)), 4)),
        "recall_95_ci": (round(float(np.percentile(rec_list, lower_p)), 4), round(float(np.percentile(rec_list, upper_p)), 4)),
        "f1_95_ci": (round(float(np.percentile(f1_list, lower_p)), 4), round(float(np.percentile(f1_list, upper_p)), 4))
    }
