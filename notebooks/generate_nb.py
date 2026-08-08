import json
import os

notebook = {
    "cells": [],
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 4
}

def add_md(text):
    notebook['cells'].append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" if i < len(text.split("\n")) - 1 else line for i, line in enumerate(text.split("\n"))]
    })

def add_code(text):
    notebook['cells'].append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" if i < len(text.split("\n")) - 1 else line for i, line in enumerate(text.split("\n"))]
    })

add_md("""# 🛡️ SentinelRisk: End-to-End Fraud Detection with LightGBM & SHAP

This notebook is part of the SentinelRisk platform, a real-time FinTech fraud detection system. 
We use the IBM Credit Card Fraud dataset (or synthetic equivalent) containing features like user info, transaction amounts, and merchant details to predict fraudulent transactions.

## Table of Contents
1. [Data Loading & Initial Exploration](#section-1)
2. [Preprocessing & Feature Engineering](#section-2)
3. [Handling Class Imbalance with SMOTE](#section-3)
4. [Model Training — LightGBM Classifier](#section-4)
5. [Model Evaluation](#section-5)
6. [SHAP Explainability](#section-6)
7. [Export Model Artifacts](#section-7)""")

add_code("""# Install dependencies (run once)
!pip install lightgbm shap imbalanced-learn scikit-learn pandas numpy matplotlib seaborn joblib -q""")

add_code("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from imblearn.over_sampling import SMOTE
from lightgbm import LGBMClassifier
import lightgbm as lgb
import shap
import joblib
import warnings
warnings.filterwarnings('ignore')""")

add_md("""## 📊 Section 1: Data Loading & Initial Exploration""")

add_code("""# Load IBM Credit Card Fraud Dataset
# Download from: https://www.kaggle.com/datasets/ealtman2019/ibm-transactions-for-anti-money-laundering-aml
# Expected columns: User, Card, Year, Month, Day, Time, Amount, Use Chip, Merchant Name, Merchant City, Merchant State, Zip, MCC, Errors?, Is Fraud?
df = pd.read_csv('card_transaction.v1.csv')
print(f'Dataset shape: {df.shape}')
print(f'\\nColumn dtypes:\\n{df.dtypes}')
df.head()""")

add_code("""# EDA - Class Imbalance Plot
plt.figure(figsize=(8, 6))
ax = sns.countplot(x='Is Fraud?', data=df)
plt.title('Class Imbalance: Fraud vs Non-Fraud Transactions')
total = len(df)
for p in ax.patches:
    height = p.get_height()
    ax.text(p.get_x() + p.get_width()/2., height + 3,
            f'{height/total:.2%}', ha='center')
plt.show()""")

add_code("""# EDA - Fraud by Hour of Day
df_hour = df.copy()
# Ensure Time is string
df_hour['Time'] = df_hour['Time'].astype(str)
# Extract hour
df_hour['Hour'] = df_hour['Time'].str.split(':').str[0].astype(float)
plt.figure(figsize=(12, 6))
sns.countplot(x='Hour', data=df_hour[df_hour['Is Fraud?'] == 'Yes'])
plt.title('Fraudulent Transactions by Hour of Day')
plt.xlabel('Hour of Day')
plt.ylabel('Count')
plt.show()""")

add_code("""# EDA - Transaction Amount Distribution
df_amt = df.copy()
# Strip $ and , from amount for EDA
if df_amt['Amount'].dtype == 'object':
    df_amt['Amount'] = df_amt['Amount'].str.replace('$', '').str.replace(',', '').astype(float)

plt.figure(figsize=(10, 6))
sns.histplot(data=df_amt, x='Amount', hue='Is Fraud?', bins=50, log_scale=True, common_norm=False, stat='density', kde=True)
plt.title('Transaction Amount Distribution (Log Scale)')
plt.xlabel('Transaction Amount ($)')
plt.show()""")

add_md("""## 🔧 Section 2: Preprocessing & Feature Engineering""")

add_code("""# Preprocessing
df_clean = df.copy()

# Strip '$' and ',' from 'Amount', convert to float
if df_clean['Amount'].dtype == 'object':
    df_clean['Amount'] = df_clean['Amount'].str.replace('$', '', regex=False).str.replace(',', '', regex=False).astype(float)

# Parse 'Time' column (HH:MM format) into 'Hour' (int) and 'Minute' (int)
df_clean['Time'] = df_clean['Time'].astype(str)
df_clean['Hour'] = df_clean['Time'].str.split(':').str[0].astype(int)
df_clean['Minute'] = df_clean['Time'].str.split(':').str[1].astype(int)

# Map 'Is Fraud?' to binary: 'Yes'->1, 'No'->0
if df_clean['Is Fraud?'].dtype == 'object':
    df_clean['Is Fraud?'] = df_clean['Is Fraud?'].map({'Yes': 1, 'No': 0})

# Map 'Errors?' NaN to 'No Error', treat as string
df_clean['Errors?'] = df_clean['Errors?'].fillna('No Error').astype(str)

# One-hot encode: 'Use Chip', 'Errors?'
df_clean = pd.get_dummies(df_clean, columns=['Use Chip', 'Errors?'], drop_first=True)

# Drop raw columns not needed
cols_to_drop = ['User', 'Card', 'Merchant Name', 'Zip', 'Time', 'Year', 'Month', 'Day', 'Merchant City', 'Merchant State']
df_clean = df_clean.drop(columns=[c for c in cols_to_drop if c in df_clean.columns])

print(f"Final feature list: {df_clean.columns.tolist()}")""")

add_code("""from sklearn.model_selection import train_test_split
X = df_clean.drop('Is Fraud?', axis=1)
y = df_clean['Is Fraud?']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f'Train: {X_train.shape}, Test: {X_test.shape}')
print(f'Train fraud rate: {y_train.mean():.4f}')""")

add_md("""## ⚖️ Section 3: Handling Class Imbalance with SMOTE""")

add_code("""from imblearn.over_sampling import SMOTE
smote = SMOTE(random_state=42, n_jobs=-1)
X_train_sm, y_train_sm = smote.fit_resample(X_train, y_train)
print(f'After SMOTE - Train shape: {X_train_sm.shape}')
print(f'Class distribution after SMOTE:\\n{pd.Series(y_train_sm).value_counts()}')""")

add_md("""## 🤖 Section 4: Model Training — LightGBM Classifier""")

add_code("""from lightgbm import LGBMClassifier
model = LGBMClassifier(
    n_estimators=500,
    learning_rate=0.05,
    num_leaves=63,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1,
    verbose=-1
)
model.fit(
    X_train_sm, y_train_sm,
    eval_set=[(X_test, y_test)],
    callbacks=[lgb.early_stopping(50), lgb.log_evaluation(100)]
)
print('Training complete.')""")

add_md("""## 📈 Section 5: Model Evaluation""")

add_code("""# Evaluation
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("Classification Report:\\n", classification_report(y_test, y_pred))
print(f"ROC-AUC Score: {roc_auc_score(y_test, y_proba):.4f}\\n")

# Confusion Matrix Heatmap
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.show()""")

add_md("""## 🔍 Section 6: SHAP Explainability""")

add_code("""import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test[:500])  # use subset for speed

# Summary plot (global feature importance)
shap.summary_plot(shap_values[1], X_test[:500], max_display=15, show=True)""")

add_code("""# Explain a single high-risk transaction
sample_idx = y_test[y_test == 1].index[0]  # first fraud transaction
sample_pos = X_test.index.get_loc(sample_idx)

shap.waterfall_plot(shap.Explanation(
    values=shap_values[1][sample_pos],
    base_values=explainer.expected_value[1],
    data=X_test.iloc[sample_pos],
    feature_names=X_test.columns.tolist()
))""")

add_md("""## 💾 Section 7: Export Model Artifacts""")

add_code("""import joblib
import os
os.makedirs('../backend', exist_ok=True)
joblib.dump(model, '../backend/lgbm_ibm_fraud_model.pkl')
joblib.dump(explainer, '../backend/shap_ibm_explainer.pkl')
print('✅ Model and SHAP explainer saved to ../backend/')
print(f'   Model file size: {os.path.getsize("../backend/lgbm_ibm_fraud_model.pkl") / 1024:.1f} KB')
print(f'   Explainer file size: {os.path.getsize("../backend/shap_ibm_explainer.pkl") / 1024:.1f} KB')""")

add_md("""## Closing Notes

The model artifacts (`lgbm_ibm_fraud_model.pkl` and `shap_ibm_explainer.pkl`) can now be integrated into a real-time prediction API (e.g., using FastAPI or Flask) for the SentinelRisk backend to score transactions on the fly and provide explainable risk scores to risk analysts.""")

target_dir = '/Users/thuva/Desktop/proj/SentinelRisk/notebooks'
os.makedirs(target_dir, exist_ok=True)
with open(os.path.join(target_dir, 'sentinel_risk_training.ipynb'), 'w') as f:
    json.dump(notebook, f, indent=1)

print(f"NOTEBOOK_DONE: {len(notebook['cells'])}")
