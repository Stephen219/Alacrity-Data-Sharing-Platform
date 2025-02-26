# import pandas as pd
# import numpy as np
# from scipy.stats import ttest_ind, levene, shapiro
# import json

# def cohen_d(x, y):
#     """Calculate Cohen’s d (effect size) for T-test."""
#     diff_mean = np.mean(x) - np.mean(y)
#     pooled_std = np.sqrt(((np.std(x, ddof=1) ** 2) + (np.std(y, ddof=1) ** 2)) / 2)
#     return diff_mean / pooled_std if pooled_std > 0 else 0

# def infer_numeric_cols(df):
#     """Detect numeric columns in the dataset."""
#     return [col for col in df.columns if np.issubdtype(df[col].dtype, np.number)]

# def infer_categorical_cols(df, threshold=10):
#     """Detect categorical columns (actual categorical or low-cardinality numerical)."""
#     return [col for col in df.columns if df[col].nunique() <= threshold or df[col].dtype == 'object']

# def auto_select_best_grouping(df):
#     """Find the best categorical column with exactly 2 groups."""
#     cat_cols = infer_categorical_cols(df)
#     for col in cat_cols:
#         unique_vals = df[col].dropna().unique()
#         if len(unique_vals) == 2:
#             return col  # Return first found valid group column
#     return None  # No valid column found

# def run_t_tests(df):
#     """
#     Runs independent T-tests for all numeric variables against the best categorical grouping column.
#     - Auto-detects best group column (binary categorical).
#     - Handles normality & variance assumptions.
#     - Computes effect size (Cohen’s d).
#     - Returns structured JSON output.
#     """
#     group_col = auto_select_best_grouping(df)
#     if not group_col:
#         return {"Error": "No valid binary categorical column found for grouping."}

#     numeric_cols = infer_numeric_cols(df)
#     unique_groups = df[group_col].dropna().unique()
#     group1, group2 = unique_groups
#     df1, df2 = df[df[group_col] == group1], df[df[group_col] == group2]

#     t_test_results, warnings = [], []

#     for num_col in numeric_cols:
#         x, y = df1[num_col].dropna(), df2[num_col].dropna()

#         if len(x) < 5 or len(y) < 5:
#             warnings.append(f"Skipping {num_col}: Not enough data points.")
#             continue

#         # Normality check
#         _, p_x = shapiro(x) if len(x) >= 3 else (None, 1)
#         _, p_y = shapiro(y) if len(y) >= 3 else (None, 1)
#         normal_x, normal_y = p_x > 0.05, p_y > 0.05

#         # Variance check
#         _, p_var = levene(x, y)
#         equal_var = p_var > 0.05

#         # Choose T-test type
#         t_stat, p_value = ttest_ind(x, y, equal_var=equal_var)

#         # Compute effect size
#         effect_size = cohen_d(x, y)
#         effect_label = "Small" if abs(effect_size) < 0.2 else "Moderate" if abs(effect_size) < 0.5 else "Large"

#         t_test_results.append({
#             "Variable": num_col,
#             "Group 1": str(group1),
#             "Group 2": str(group2),
#             "T-Statistic": round(t_stat, 4),
#             "p-value": round(p_value, 8),
#             "Equal Variance Assumed": equal_var,
#             "Cohen's d": round(effect_size, 4),
#             "Effect Strength": effect_label,
#             "Conclusion": "Significant" if p_value < 0.05 else "Not Significant"
#         })

#     return {"T-Test Results": t_test_results, "Warnings": warnings, "Group Column Used": group_col}



