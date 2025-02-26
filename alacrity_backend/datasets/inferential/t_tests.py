

import pandas as pd
import numpy as np
from scipy.stats import ttest_ind, levene, normaltest
import json
from itertools import combinations

def cohen_d(x, y):
    """Calculate Cohen's d for independent samples."""
    n1, n2 = len(x), len(y)
    if n1 < 2 or n2 < 2:
        return 0.0
    diff_mean = float(np.mean(x)) - float(np.mean(y))
    s1, s2 = float(np.var(x, ddof=1)), float(np.var(y, ddof=1))
    pooled_std = float(np.sqrt(((n1 - 1) * s1 + (n2 - 1) * s2) / (n1 + n2 - 2)))
    return float(diff_mean / pooled_std if pooled_std > 0 else 0)

def check_normality(data):
    """Check normality using D'Agostino and Pearson's test."""
    if len(data) < 3 or float(np.var(data)) == 0:
        return False, 0.0
    try:
        stat, p_val = normaltest(data)
        return bool(p_val > 0.05), float(p_val) 
    except Exception:
        return False, 0.0

def clean_numeric_series(series):
    """Convert series to numeric, excluding zero-variance data."""
    numeric_series = pd.to_numeric(series, errors='coerce')
    if numeric_series.std() == 0 or pd.isna(numeric_series.std()):
        return pd.Series(dtype='float64')
    return numeric_series.dropna()

def infer_numeric_cols(df):
    """Detect numeric columns with sufficient variance."""
    return [col for col in df.columns if len(clean_numeric_series(df[col])) > 2 and clean_numeric_series(df[col]).std() > 0]

def infer_categorical_cols(df, threshold=10):
    """Detect categorical columns, including low-cardinality numerics."""
    return [col for col in df.columns if df[col].nunique(dropna=True) <= threshold or df[col].dtype == 'object']

def get_binary_grouping_cols(df):
    """Find binary categorical columns and score them by balance."""
    cat_cols = infer_categorical_cols(df)
    binary_cols = []
    for col in cat_cols:
        unique_vals = df[col].dropna().unique()
        if len(unique_vals) == 2:
            group_sizes = df[col].value_counts()
            max_size = int(max(group_sizes))
            if max_size > 0:
                balance_score = float(min(group_sizes) / max_size)
                binary_cols.append((col, str(unique_vals[0]), str(unique_vals[1]), balance_score))
    binary_cols.sort(key=lambda x: x[3], reverse=True)
    return binary_cols

def run_t_tests(df, alpha=0.05, min_sample_size=30):
    """
    Runs t-tests with improved handling for large datasets.

    Parameters:
    -----------
    df : pandas DataFrame
        Input data
    alpha : float
        Significance level (default: 0.05)
    min_sample_size : int
        Minimum sample size (default: 30)

    Returns:
    --------
    dict : JSON-serializable results
    """
    results = []  # Fixed: Use a list instead of dict
    warnings = []

    # Independent t-tests
    binary_grouping_cols = get_binary_grouping_cols(df)
    if not binary_grouping_cols:
        return {"Error": "No suitable binary grouping columns found."}

    for group_col, group1, group2, balance_score in binary_grouping_cols:
        df1, df2 = df[df[group_col] == group1], df[df[group_col] == group2]
        
        for num_col in infer_numeric_cols(df):
            x = clean_numeric_series(df1[num_col])
            y = clean_numeric_series(df2[num_col])
            
            if len(x) < min_sample_size or len(y) < min_sample_size:
                warnings.append(f"Skipping {num_col} for {group_col}: Insufficient sample size (n1={len(x)}, n2={len(y)})")
                continue
            
            if float(np.var(x)) == 0 or float(np.var(y)) == 0:
                warnings.append(f"Skipping {num_col} for {group_col}: Zero variance in one or both groups")
                continue

            try:
                # Variance check
                _, p_var = levene(x, y)
                equal_var = bool(p_var > alpha)  # Convert to native bool

                # Independent t-test
                t_stat, p_val = ttest_ind(x, y, equal_var=equal_var)
                effect_size = cohen_d(x, y)

                results.append({
                    "Test Type": "Independent",
                    "Variable": str(num_col),
                    "Group Column": str(group_col),
                    "Group 1": str(group1),
                    "Group 2": str(group2),
                    "Sample Sizes": {"Group1": int(len(x)), "Group2": int(len(y))},
                    "T-Statistic": float(round(t_stat, 4)),
                    "p-value": float(round(p_val, 8)),
                    "Equal Variance": equal_var,  # Already native bool
                    "Levene's Test p-value": float(round(p_var, 4)),
                    "Cohen's d": float(round(effect_size, 4)),
                    "Effect Strength": str("Small" if abs(effect_size) < 0.2 else "Moderate" if abs(effect_size) < 0.5 else "Large"),
                    "Conclusion": str("Significant" if p_val < alpha else "Not Significant"),
                    "Group Balance Score": float(round(balance_score, 4))
                })
            except Exception as e:
                warnings.append(f"Error analyzing {num_col} for {group_col}: {str(e)}")

    return {
        "Results": results,
        "Warnings": warnings,
        "Grouping Columns Used": [str(col[0]) for col in binary_grouping_cols],
        "Analysis Parameters": {
            "Significance Level": float(alpha),
            "Minimum Sample Size": int(min_sample_size)
        }
    }

