# import pandas as pd
# import numpy as np
# from scipy.stats import f_oneway, levene, shapiro
# from statsmodels.stats.multicomp import MultiComparison
# import logging

# # Set up logging for progress tracking
# logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
# logger = logging.getLogger(__name__)

# def clean_numeric_series(series):
#     """Convert series to numeric, handling non-numeric values gracefully."""
#     cleaned = pd.to_numeric(series, errors='coerce').dropna()
#     logger.debug(f"Cleaned series: {len(cleaned)} valid entries")
#     return cleaned

# def infer_numeric_cols(df):
#     """Detect numeric columns with sufficient valid data."""
#     logger.info("Inferring numeric columns...")
#     cols = [col for col in df.columns if clean_numeric_series(df[col]).notna().sum() > 5]
#     logger.info(f"Numeric columns found: {cols}")
#     return cols

# def infer_categorical_cols(df, min_groups=3, max_groups=10):
#     """Detect categorical columns suitable for ANOVA (3+ groups)."""
#     logger.info("Inferring categorical columns...")
#     cols = [col for col in df.columns if min_groups <= df[col].nunique(dropna=True) <= max_groups or df[col].dtype == 'object']
#     logger.info(f"Categorical columns found: {cols}")
#     return cols

# def has_variation(data):
#     """Check if a group has non-zero variance."""
#     cleaned = clean_numeric_series(data)
#     variation = len(cleaned) > 1 and np.var(cleaned) > 0
#     logger.debug(f"Variation check: {variation}, size: {len(cleaned)}")
#     return variation

# def check_normality(data):
#     """Check normality with Shapiro-Wilk, handling edge cases."""
#     cleaned = clean_numeric_series(data)
#     if len(cleaned) < 3 or len(cleaned) > 5000 or not has_variation(cleaned):
#         logger.debug(f"Normality skipped: {len(cleaned)} samples or no variation")
#         return False, 0.0
#     try:
#         _, p_val = shapiro(cleaned)
#         logger.debug(f"Shapiro p-value: {p_val}")
#         return p_val > 0.05, float(p_val)
#     except Exception as e:
#         logger.warning(f"Normality check failed: {e}")
#         return False, 0.0

# def calculate_eta_squared(groups):
#     """Compute eta-squared (η²) with robust handling."""
#     try:
#         valid_groups = [g for g in groups if has_variation(g) and len(g) > 1]
#         if len(valid_groups) < 2:
#             logger.debug("Eta-squared: too few valid groups")
#             return 0.0
#         grand_mean = np.mean(np.concatenate(valid_groups))
#         ss_total = sum(np.sum((g - grand_mean) ** 2) for g in valid_groups)
#         ss_between = sum(len(g) * (np.mean(g) - grand_mean) ** 2 for g in valid_groups)
#         eta = ss_between / ss_total if ss_total > 0 else 0.0
#         logger.debug(f"Eta-squared: {eta}")
#         return eta
#     except Exception as e:
#         logger.warning(f"Eta-squared failed: {e}")
#         return 0.0

# def run_anova_tests(df, alpha=0.05, min_sample_size=5):
#     """
#     Runs intelligent one-way ANOVA with post-hoc analysis and diagnostics.

#     Parameters:
#     -----------
#     df : pandas DataFrame
#         Input data
#     alpha : float
#         Significance level (default: 0.05)
#     min_sample_size : int
#         Minimum sample size per group (default: 5)

#     Returns:
#     --------
#     dict : Results compatible with correlation_data['inferential_statistics']
#     """
#     logger.info("Starting ANOVA analysis...")
#     numeric_cols = infer_numeric_cols(df)
#     categorical_cols = infer_categorical_cols(df)
#     results = {}
#     warnings = []

#     if not categorical_cols or not numeric_cols:
#         logger.error("No suitable columns found")
#         return {"Error": "No suitable categorical (3+ groups) or numeric columns found."}

#     for cat_col in categorical_cols:
#         logger.info(f"Processing grouping variable: {cat_col}")
#         unique_groups = df[cat_col].dropna().unique()
#         if len(unique_groups) < 3:
#             warnings.append(f"Skipping {cat_col}: Fewer than 3 groups.")
#             continue

#         group_results = {}
#         for num_col in numeric_cols:
#             logger.info(f"Analyzing {num_col} against {cat_col}")
#             group_data = [clean_numeric_series(df[df[cat_col] == group][num_col]) for group in unique_groups]
#             valid_groups = [g for g in group_data if len(g) >= min_sample_size and has_variation(g)]

#             if len(valid_groups) < 3:
#                 warnings.append(f"Skipping {num_col} for {cat_col}: Too few valid groups (n={len(valid_groups)}).")
#                 continue

#             # Normality check
#             normality_results = {str(group): check_normality(df[df[cat_col] == group][num_col]) 
#                                 for group in unique_groups}
#             non_normal_groups = [group for group, (is_normal, _) in normality_results.items() if not is_normal]
#             if non_normal_groups:
#                 warnings.append(f"Warning: {num_col} for {cat_col} may not be normal in groups: {non_normal_groups}")

#             # Homogeneity of variances
#             try:
#                 _, p_var = levene(*valid_groups)
#                 equal_var = p_var > alpha
#             except Exception as e:
#                 p_var = 0.0
#                 equal_var = False
#                 warnings.append(f"Warning: Levene test failed for {num_col} in {cat_col}: {e}")

#             # ANOVA
#             try:
#                 f_stat, p_val = f_oneway(*valid_groups)
#                 if not np.isfinite(f_stat) or not np.isfinite(p_val):
#                     raise ValueError("F-statistic or p-value not finite")
#                 eta_sq = calculate_eta_squared(valid_groups)
#                 effect_label = "Small" if eta_sq < 0.01 else "Moderate" if eta_sq < 0.06 else "Large"
#             except Exception as e:
#                 warnings.append(f"Error: ANOVA failed for {num_col} in {cat_col}: {e}")
#                 continue

#             # Post-hoc analysis (Tukey HSD)
#             post_hoc = {}
#             if p_val < alpha:
#                 try:
#                     all_data = pd.concat([pd.Series(g, name=num_col) for g in valid_groups])
#                     all_groups = np.concatenate([np.full(len(g), str(unique_groups[i])) 
#                                                 for i, g in enumerate(group_data) if len(g) >= min_sample_size and has_variation(g)])
#                     mc = MultiComparison(all_data, all_groups)
#                     tukey_result = mc.tukeyhsd()
#                     significant_pairs = [
#                         {"Group1": str(row[0]), "Group2": str(row[1]), "p-value": round(float(row[4]), 4)}
#                         for row in tukey_result._results_table.data[1:]  # Skip header
#                         if row[6]  # Reject flag
#                     ]
#                     post_hoc = {"Significant Pairs": significant_pairs}
#                 except Exception as e:
#                     warnings.append(f"Warning: Tukey HSD failed for {num_col} in {cat_col}: {e}")

#             # Store results with native Python types
#             group_results[num_col] = {
#                 "Dependent Variable": str(num_col),
#                 "Group Values": [str(g) for g in unique_groups],
#                 "Sample Sizes": {str(unique_groups[i]): int(len(g)) for i, g in enumerate(group_data)},
#                 "F-Statistic": float(round(f_stat, 4)),
#                 "p-value": float(round(p_val, 8)),
#                 "Equal Variance": bool(equal_var),
#                 "Levene's Test p-value": float(round(p_var, 4)),
#                 "Normality p-values": {group: float(round(p_val, 4)) for group, (_, p_val) in normality_results.items()},
#                 "Eta Squared": float(round(eta_sq, 4)),
#                 "Effect Strength": str(effect_label),
#                 "Conclusion": str("Significant" if p_val < alpha else "Not Significant"),
#                 "Post-Hoc (Tukey HSD)": post_hoc if post_hoc else "Not applicable"
#             }
#         if group_results:
#             results[f"Grouping Variable: {cat_col}"] = group_results

#     logger.info("ANOVA analysis completed")
#     return {"anova_results2": results, "Warnings": warnings}

# # # Example usage (to be integrated into your main script)
# # if __name__ == "__main__":
# #     logger.info("Loading dataset...")
# #     df = pd.read_csv("Thyroid_Diff.csv")
# #     logger.info("Running ANOVA tests...")
# #     anova_results = run_anova_tests(df)
# #     print(anova_results)




import pandas as pd
import numpy as np
from scipy.stats import f_oneway, levene, shapiro
from statsmodels.stats.multicomp import MultiComparison
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger(__name__)

def clean_numeric_series(series):
    """Convert series to numeric, handling non-numeric values gracefully."""
    cleaned = pd.to_numeric(series, errors='coerce').dropna()
    logger.debug(f"Cleaned series: {len(cleaned)} valid entries")
    return cleaned

def infer_numeric_cols(df):
    """Detect numeric columns with sufficient valid data."""
    logger.info("Inferring numeric columns...")
    cols = [col for col in df.columns if clean_numeric_series(df[col]).notna().sum() > 5]
    logger.info(f"Numeric columns found: {cols}")
    return cols

def infer_categorical_cols(df, min_groups=3, max_groups=10):
    """Detect categorical columns suitable for ANOVA (3+ groups)."""
    logger.info("Inferring categorical columns...")
    cols = [col for col in df.columns if min_groups <= df[col].nunique(dropna=True) <= max_groups or df[col].dtype == 'object']
    logger.info(f"Categorical columns found: {cols}")
    return cols

def has_variation(data):
    """Check if a group has non-zero variance."""
    cleaned = clean_numeric_series(data)
    variation = len(cleaned) > 1 and np.var(cleaned) > 0
    logger.debug(f"Variation check: {variation}, size: {len(cleaned)}")
    return variation

def check_normality(data):
    """Check normality with Shapiro-Wilk, ensuring native float return."""
    cleaned = clean_numeric_series(data)
    if len(cleaned) < 3 or len(cleaned) > 5000 or not has_variation(cleaned):
        logger.debug(f"Normality skipped: {len(cleaned)} samples or no variation")
        return False, 0.0
    try:
        _, p_val = shapiro(cleaned)
        logger.debug(f"Shapiro p-value: {p_val}")
        return bool(p_val > 0.05), float(p_val)  # Explicitly convert to native bool and float
    except Exception as e:
        logger.warning(f"Normality check failed: {e}")
        return False, 0.0

def calculate_eta_squared(groups):
    """Compute eta-squared (η²) with robust handling."""
    try:
        valid_groups = [g for g in groups if has_variation(g) and len(g) > 1]
        if len(valid_groups) < 2:
            logger.debug("Eta-squared: too few valid groups")
            return 0.0
        grand_mean = float(np.mean(np.concatenate(valid_groups)))
        ss_total = float(sum(np.sum((g - grand_mean) ** 2) for g in valid_groups))
        ss_between = float(sum(len(g) * (np.mean(g) - grand_mean) ** 2 for g in valid_groups))
        eta = ss_between / ss_total if ss_total > 0 else 0.0
        logger.debug(f"Eta-squared: {eta}")
        return eta
    except Exception as e:
        logger.warning(f"Eta-squared failed: {e}")
        return 0.0

def run_anova_tests(df, alpha=0.05, min_sample_size=5):
    """
    Runs intelligent one-way ANOVA with post-hoc analysis and diagnostics.

    Parameters:
    -----------
    df : pandas DataFrame
        Input data
    alpha : float
        Significance level (default: 0.05)
    min_sample_size : int
        Minimum sample size per group (default: 5)

    Returns:
    --------
    dict : Results compatible with correlation_data['inferential_statistics']
    """
    logger.info("Starting ANOVA analysis...")
    numeric_cols = infer_numeric_cols(df)
    categorical_cols = infer_categorical_cols(df)
    results = {}
    warnings = []

    if not categorical_cols or not numeric_cols:
        logger.error("No suitable columns found")
        return {"Error": "No suitable categorical (3+ groups) or numeric columns found."}

    for cat_col in categorical_cols:
        logger.info(f"Processing grouping variable: {cat_col}")
        unique_groups = df[cat_col].dropna().unique()
        if len(unique_groups) < 3:
            warnings.append(f"Skipping {cat_col}: Fewer than 3 groups.")
            continue

        group_results = {}
        for num_col in numeric_cols:
            logger.info(f"Analyzing {num_col} against {cat_col}")
            group_data = [clean_numeric_series(df[df[cat_col] == group][num_col]) for group in unique_groups]
            valid_groups = [g for g in group_data if len(g) >= min_sample_size and has_variation(g)]

            if len(valid_groups) < 3:
                warnings.append(f"Skipping {num_col} for {cat_col}: Too few valid groups (n={len(valid_groups)}).")
                continue

            # Normality check
            normality_results = {str(group): check_normality(df[df[cat_col] == group][num_col]) 
                                for group in unique_groups}
            non_normal_groups = [group for group, (is_normal, _) in normality_results.items() if not is_normal]
            if non_normal_groups:
                warnings.append(f"Warning: {num_col} for {cat_col} may not be normal in groups: {non_normal_groups}")

            # Homogeneity of variances
            try:
                _, p_var = levene(*valid_groups)
                equal_var = p_var > alpha
            except Exception as e:
                p_var = 0.0
                equal_var = False
                warnings.append(f"Warning: Levene test failed for {num_col} in {cat_col}: {e}")

            # ANOVA
            try:
                f_stat, p_val = f_oneway(*valid_groups)
                if not np.isfinite(f_stat) or not np.isfinite(p_val):
                    raise ValueError("F-statistic or p-value not finite")
                eta_sq = calculate_eta_squared(valid_groups)
                effect_label = "Small" if eta_sq < 0.01 else "Moderate" if eta_sq < 0.06 else "Large"
            except Exception as e:
                warnings.append(f"Error: ANOVA failed for {num_col} in {cat_col}: {e}")
                continue

            # Post-hoc analysis (Tukey HSD)
            post_hoc = {}
            if p_val < alpha:
                try:
                    all_data = pd.concat([pd.Series(g, name=num_col) for g in valid_groups])
                    all_groups = np.concatenate([np.full(len(g), str(unique_groups[i])) 
                                                for i, g in enumerate(group_data) if len(g) >= min_sample_size and has_variation(g)])
                    mc = MultiComparison(all_data, all_groups)
                    tukey_result = mc.tukeyhsd()
                    significant_pairs = [
                        {"Group1": str(row[0]), "Group2": str(row[1]), "p-value": round(float(row[4]), 4)}
                        for row in tukey_result._results_table.data[1:]  # Skip header
                        if bool(row[6])  # Explicitly convert reject flag to native bool
                    ]
                    post_hoc = {"Significant Pairs": significant_pairs}
                except Exception as e:
                    warnings.append(f"Warning: Tukey HSD failed for {num_col} in {cat_col}: {e}")

            # Store results with native Python types
            group_results[num_col] = {
                "Dependent Variable": str(num_col),
                "Group Values": [str(g) for g in unique_groups],
                "Sample Sizes": {str(unique_groups[i]): int(len(g)) for i, g in enumerate(group_data)},
                "F-Statistic": float(round(f_stat, 4)),
                "p-value": float(round(p_val, 8)),
                "Equal Variance": bool(equal_var),  # Ensure native bool
                "Levene's Test p-value": float(round(p_var, 4)),
                "Normality p-values": {group: float(round(p_val, 4)) for group, (_, p_val) in normality_results.items()},
                "Eta Squared": float(round(eta_sq, 4)),
                "Effect Strength": str(effect_label),
                "Conclusion": str("Significant" if p_val < alpha else "Not Significant"),
                "Post-Hoc (Tukey HSD)": post_hoc if post_hoc else "Not applicable"
            }
        if group_results:
            results[f"Grouping Variable: {cat_col}"] = group_results

    logger.info("ANOVA analysis completed")
    return {"anova_results2": results, "Warnings": warnings}

