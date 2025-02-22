import json
import os

import pandas as pd
from minio import Minio
from alacrity_backend.settings import MINIO_URL
from datasets.models import Dataset
import io
from django.shortcuts import get_object_or_404, render

from io import BytesIO
from minio import Minio
import numpy as np
import scipy.stats as stats
from .inferential.t_tests import run_t_tests



###%%%%%%%%%%%%%%%%%%%%%%%%%%%#####3%%%%%func imports%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
from .inferential.anova import run_anova_tests
from .inferential.t_tests import run_t_tests

#$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

# TODO: Add the MinIO client configuration TO PREVENT REPEATED CODE

minio_client = Minio(
    endpoint="10.72.98.137:9000", 
    access_key="admin",
    secret_key="Notgood1",
    secure=False  
)






def fetch_json_from_minio(analysis_link):
    """
    Fetches the correlation analysis JSON file from MinIO using the analysis link provided.
    Returns the data in dictionary form if successful, otherwise None.
    """
    try:
        # Extract the bucket and object names from the analysis_link
        minio_url_parts = analysis_link.replace("http://", "").split("/")
        bucket_name = minio_url_parts[1]
        object_name = "/".join(minio_url_parts[2:])

        print(f"Fetching Correlation Analysis from MinIO:\nBucket: {bucket_name}, Object: {object_name}")

        # Fetch the object from MinIO
        response = minio_client.get_object(bucket_name, object_name)
        
        # Read and parse the JSON data
        json_data = json.load(BytesIO(response.read()))  # Convert bytes to JSON
        print("Successfully fetched the correlation analysis data")

        return json_data

    except Exception as e:
        print(f"Error fetching JSON from MinIO: {str(e)}")
        return None



def calculate_correlation(df):
    """Calculates and returns Pearson and Spearman correlation matrices for numerical columns."""
    numeric_data = df.select_dtypes(include=['number'])
    if numeric_data.empty:
        return None, None
    
    pearson_corr = numeric_data.corr(method='pearson')
    spearman_corr = numeric_data.corr(method='spearman')

    return pearson_corr, spearman_corr



def calculate_range(df):
    """Calculates the range (min, max) for numerical columns."""
    numeric_data = df.select_dtypes(include=['number'])  # Select only numerical columns
    ranges = {}

    # Apply range calculation only on numeric data
    for column in numeric_data.columns:
        column_range = {
            "min": numeric_data[column].min(),
            "max": numeric_data[column].max()
        }
        ranges[column] = column_range
    
    return ranges


def calculate_non_numeric_stats(df):
    """Calculates statistics for non-numeric columns (Unique Values, Value Counts)."""
    non_numeric_data = df.select_dtypes(exclude=['number'])
    non_numeric_stats = {}

    for column in non_numeric_data.columns:
        # Unique value count
        unique_values_count = non_numeric_data[column].nunique()
        
        # Frequency of categories (for pie chart purposes)
        value_counts = non_numeric_data[column].value_counts().to_dict()

        non_numeric_stats[column] = {
            "unique_values_count": unique_values_count,
            "value_counts": value_counts
        }
    
    return non_numeric_stats

def convert_df_types(df):
    """Convert all pandas DataFrame numeric types to native Python types for JSON serialization."""
    def convert_numeric(x):
        try:
            if pd.isna(x):
                return None
            if isinstance(x, (np.integer, np.floating)):
                return x.item()
            return x
        except:
            return x
    
    return df.astype(object).applymap(convert_numeric)
# FIXME :  FUNC  NAME TO ANALYSIS



def compute_correlation(file_path, json_output_path, dataset_id):
    """Reads CSV, computes correlation, range, and non-numeric stats, and saves the results as JSON."""
    try:
        df = pd.read_csv(file_path)
        df = df.drop(columns=['target'], errors='ignore')  # Remove target column if it exists

        # Calculate correlation
        pearson_corr, spearman_corr = calculate_correlation(df)
        pearson_dict = convert_df_types(pearson_corr).to_dict() if pearson_corr is not None else {}
        spearman_dict = convert_df_types(spearman_corr).to_dict() if spearman_corr is not None else {}

        # Calculate range
        ranges = calculate_range(df)
        for col in ranges:
            ranges[col] = {k: float(v) if isinstance(v, np.floating) else int(v) if isinstance(v, np.integer) else v 
                          for k, v in ranges[col].items()}

        # Calculate non-numeric statistics
        non_numeric_stats = calculate_non_numeric_stats(df)
        for col in non_numeric_stats:
            non_numeric_stats[col]["value_counts"] = {
                str(k): int(v) if isinstance(v, np.integer) else float(v) if isinstance(v, np.floating) else v
                for k, v in non_numeric_stats[col]["value_counts"].items()
            }

        # Perform inferential statistics
        t_tests = perform_t_tests(df)
        t_tests2 = run_t_tests(df)
        
        anova_tests = perform_anova(df)




        anover_results = run_anova_tests(df)


        my_chi_square_tests = run_chi_square_tests(df)
        my_chi_square_tests2 = run_chi_square_tests2(df)
        
        ####
        # t tests
        # t_tests2 = run_t_tests(df)

        # Prepare JSON output
        correlation_data = {
            "desptive_stats": {"i will add later": "i will add later"},
            "correlation": {
                "pearson": pearson_dict,
                "spearman": spearman_dict
            },
            "ranges": ranges,
            "non_numeric_stats": non_numeric_stats,
            "inferential_statistics": {
                # "t_tests": t_tests,


                "t_tests": t_tests2,
               
                # "anova_tests": anova_tests,
                "anova_results": anover_results,
                # "my_chi_square_tests": my_chi_square_tests, # 2nd last Chi-Square tests
                "chi_square_tests": my_chi_square_tests2  # New Chi-Square tests
            }
            
        }
        
    
    
        print (correlation_data.keys())
        print (correlation_data['correlation'].keys())
        print()

        # Save JSON
        with open(json_output_path, "w") as json_file:
            json.dump(correlation_data, json_file, indent=4)

        print(f"Analysis saved at {json_output_path}")

        # Upload to MinIO
        minio_bucket = "alacrity"
        minio_object_name = f"analysis/{os.path.basename(json_output_path)}"

        with open(json_output_path, "rb") as json_file:
            minio_client.put_object(
                minio_bucket, minio_object_name, json_file,
                length=os.path.getsize(json_output_path),
                content_type="application/json"
            )

        # Generate MinIO URL
        minio_url = f"{MINIO_URL}/{minio_bucket}/{minio_object_name}"
        print(f"Analysis uploaded to MinIO: {minio_url}")

        # Update dataset
        dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
        dataset.analysis_link = minio_url
        dataset.save()
        print(f"Dataset updated with analysis link: {dataset.analysis_link}")

        # Cleanup
        os.remove(file_path)
        os.remove(json_output_path)

    except Exception as e:
        # print the method the error occurred in
        print( f"Error computing correlation, range, and stats: {str(e)}")
        print(f"Error computing correlation, range, and stats: {str(e)}")






















#################################################################3


def infer_data_types(df):
    """Detect categorical and numerical columns."""
    categorical_cols = []
    numerical_cols = []
    
    for col in df.columns:
        unique_values = df[col].nunique()
        if df[col].dtype == 'object' or unique_values < 10:  
            categorical_cols.append(col)
        else:
            numerical_cols.append(col)

    return categorical_cols, numerical_cols


from scipy.stats import chi2_contingency, ttest_ind, f_oneway

def run_chi_square_tests(df):
    """Run Chi-Square test on categorical variables."""
    categorical_cols, _ = infer_data_types(df)
    chi_results = []

    for i in range(len(categorical_cols)):
        for j in range(i + 1, len(categorical_cols)):
            var1, var2 = categorical_cols[i], categorical_cols[j]
            contingency_table = pd.crosstab(df[var1], df[var2])

            try:
                chi2, p, dof, expected = chi2_contingency(contingency_table)
                chi_results.append({
                    "Variable 1": var1,
                    "Variable 2": var2,
                    "Chi-Square": chi2,
                    "p-value": p,
                    "Degrees of Freedom": dof,
                    "Conclusion": "Significant" if p < 0.05 else "Not Significant"
                })
            except Exception as e:
                print(f"Skipping {var1} vs {var2}: {e}")

    return chi_results


#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%second approach to chi square test%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


def cramers_v(chi2_stat, n, dof):
    """Calculate Cramér’s V (effect size) for Chi-Square test."""
    return np.sqrt(chi2_stat / (n * dof))

def infer_categorical_cols(df, threshold=10):
    """Detect categorical columns (both actual categorical and low-cardinality numerical)."""
    categorical_cols = [col for col in df.columns if df[col].nunique() <= threshold or df[col].dtype == 'object']
    return categorical_cols

def run_chi_square_tests2(df, min_expected_freq=5):
    """
    Runs Chi-Square tests on all categorical column pairs.
    - Ignores low-frequency categories.
    - Uses Cramér’s V for effect size.
    - Returns structured JSON output.
    """
    categorical_cols = infer_categorical_cols(df)
    chi_results = []
    warnings = []
    
    for i in range(len(categorical_cols)):
        for j in range(i + 1, len(categorical_cols)):
            var1, var2 = categorical_cols[i], categorical_cols[j]
            contingency_table = pd.crosstab(df[var1], df[var2])

            # Skip if the table is too small
            if contingency_table.shape[0] < 2 or contingency_table.shape[1] < 2:
                warnings.append(f"Skipping {var1} vs {var2}: Not enough categories.")
                continue

            # Ensure no rows/columns have all zeros
            if (contingency_table.sum(axis=1) == 0).any() or (contingency_table.sum(axis=0) == 0).any():
                warnings.append(f"Skipping {var1} vs {var2}: Empty categories found.")
                continue

            # Compute Chi-Square
            chi2_stat, p, dof, expected = chi2_contingency(contingency_table)

            # Check expected frequencies
            if (expected < min_expected_freq).sum() > 0:
                warnings.append(f"Chi-Square for {var1} vs {var2} may be unreliable: Low expected frequencies detected.")

            # Calculate Cramér’s V
            n = df.shape[0]  # Sample size
            effect_size = cramers_v(chi2_stat, n, dof)

            # Interpret effect size (Cohen’s convention)
            if effect_size < 0.1:
                strength = "Weak"
            elif effect_size < 0.3:
                strength = "Moderate"
            else:
                strength = "Strong"

            # Store results
            chi_results.append({
                "Variable 1": var1,
                "Variable 2": var2,
                "Chi-Square": chi2_stat,
                "p-value": p,
                "Degrees of Freedom": dof,
                "Cramér's V": effect_size,
                "Effect Strength": strength,
                "Conclusion": "Significant" if p < 0.05 else "Not Significant"
            })

    return {"Chi-Square Tests": chi_results, "Warnings": warnings}





########################################################################################################
















































def perform_t_tests(df):
    """Perform t-tests for numerical variables grouped by categorical variables with 2 groups."""
    categorical_cols = df.select_dtypes(exclude=['number']).columns
    numerical_cols = df.select_dtypes(include=['number']).columns
    t_test_results = {}

    for cat_col in categorical_cols:
        if df[cat_col].nunique() == 2:  # Ensure exactly two groups
            groups = list(df[cat_col].unique())
            group1 = df[df[cat_col] == groups[0]]
            group2 = df[df[cat_col] == groups[1]]

            for num_col in numerical_cols:
                t_stat, p_value = stats.ttest_ind(group1[num_col].dropna(), group2[num_col].dropna(), equal_var=False)
                t_test_results[f"{num_col} by {cat_col}"] = {"t_statistic": t_stat, "p_value": p_value}

    return t_test_results





def perform_anova(df):
    """Perform ANOVA for numerical variables grouped by categorical variables with 3+ groups."""
    categorical_cols = df.select_dtypes(exclude=['number']).columns
    numerical_cols = df.select_dtypes(include=['number']).columns
    anova_results = {}

    for cat_col in categorical_cols:
        if df[cat_col].nunique() >= 3:  # Ensure at least three groups
            for num_col in numerical_cols:
                groups = [df[df[cat_col] == value][num_col].dropna() for value in df[cat_col].unique()]
                f_stat, p_value = stats.f_oneway(*groups)

                anova_results[f"{num_col} by {cat_col}"] = {"f_statistic": f_stat, "p_value": p_value}

    return anova_results



