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
# def compute_correlation(file_path, json_output_path, dataset_id):
#     """Reads CSV, computes correlation, range, and non-numeric stats, and saves the results as JSON."""
#     try:
#         df = pd.read_csv(file_path)
#         df = df.drop(columns=['target'], errors='ignore')  # Remove target column if it exists

#         # Calculate correlation for numeric columns
#         pearson_corr, spearman_corr = calculate_correlation(df)
        
#         # Convert correlation matrices to native Python types
#         pearson_dict = convert_df_types(pearson_corr).to_dict() if pearson_corr is not None else {}
#         spearman_dict = convert_df_types(spearman_corr).to_dict() if spearman_corr is not None else {}

#         # Store correlation results
#         correlation_data = {
#             "pearson": pearson_dict,
#             "spearman": spearman_dict
#         }

#         # Calculate range for numerical columns
#         ranges = calculate_range(df)
#         # Convert numpy types in ranges to native Python types
#         for col in ranges:
#             ranges[col] = {k: float(v) if isinstance(v, np.floating) else int(v) if isinstance(v, np.integer) else v 
#                           for k, v in ranges[col].items()}

#         # Add range data to the correlation data
#         correlation_data["ranges"] = ranges

#         # Calculate statistics for non-numeric columns
#         non_numeric_stats = calculate_non_numeric_stats(df)
        
#         # Convert any numpy types in value_counts to native Python types
#         for col in non_numeric_stats:
#             non_numeric_stats[col]["value_counts"] = {
#                 str(k): int(v) if isinstance(v, np.integer) else float(v) if isinstance(v, np.floating) else v
#                 for k, v in non_numeric_stats[col]["value_counts"].items()
#             }


#         t_tests = perform_t_tests(df)
#         chi_square_tests = perform_chi_square_tests(df)
#         anova_tests = perform_anova(df)

#         # Add inferential tests to the correlation data in the inferential tests
        


        

#         # Add non-numeric stats to the correlation data
#         correlation_data["non_numeric_stats"] = non_numeric_stats

#         # Save the correlation data as JSON
#         with open(json_output_path, "w") as json_file:
#             json.dump(correlation_data, json_file, indent=4)
        
#         print(f"Correlation, range, and stats saved at {json_output_path}")

#         # Upload the JSON to MinIO
#         minio_bucket = "alacrity"
#         minio_object_name = f"analysis/{os.path.basename(json_output_path)}"

#         with open(json_output_path, "rb") as json_file:
#             minio_client.put_object(
#                 minio_bucket, minio_object_name, json_file,
#                 length=os.path.getsize(json_output_path),
#                 content_type="application/json"
#             )

#         # Generate the MinIO URL
#         minio_url = f"{MINIO_URL}/{minio_bucket}/{minio_object_name}"
#         print(f"Correlation, range, and stats uploaded to MinIO: {minio_url}")

#         # Update the dataset record with the analysis link
#         try:
#             dataset = Dataset.objects.get(dataset_id=dataset_id)
#             dataset.analysis_link = minio_url
#             dataset.save()
#             print(f"Dataset updated with analysis link: {dataset.analysis_link}")
#         except Dataset.DoesNotExist:
#             print(f"Dataset with ID {dataset_id} does not exist.")
#             return

#         # Clean up temporary files
#         os.remove(file_path)
#         os.remove(json_output_path)

#     except Exception as e:
#         print(f"Error computing correlation, range, and stats: {str(e)}")







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
        chi_square_tests = perform_chi_square_tests(df)
        anova_tests = perform_anova(df)

        # Prepare JSON output
        correlation_data = {
            "correlation": {
                "pearson": pearson_dict,
                "spearman": spearman_dict
            },
            "ranges": ranges,
            "non_numeric_stats": non_numeric_stats,
            "inferential_statistics": {
                "t_tests": t_tests,
                "chi_square_tests": chi_square_tests,
                "anova_tests": anova_tests
            }
        }

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
        print(f"Error computing correlation, range, and stats: {str(e)}")

#################################################################3

# infelential tests



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


def perform_chi_square_tests(df):
    """Perform Chi-Square tests for categorical variables."""
    categorical_cols = df.select_dtypes(exclude=['number']).columns
    chi_square_results = {}

    for i in range(len(categorical_cols)):
        for j in range(i + 1, len(categorical_cols)):  
            cat_col1, cat_col2 = categorical_cols[i], categorical_cols[j]
            contingency_table = pd.crosstab(df[cat_col1], df[cat_col2])

            chi_stat, p_value, _, _ = stats.chi2_contingency(contingency_table)
            chi_square_results[f"{cat_col1} vs {cat_col2}"] = {"chi_statistic": chi_stat, "p_value": p_value}

    return chi_square_results


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



