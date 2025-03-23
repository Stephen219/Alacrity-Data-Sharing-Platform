def pre_analysis(df):
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    categorical_summary = {
        col: df[col].value_counts().to_dict()  #
        for col in categorical_cols
    }
    return {
        "total_rows": len(df),
        "columns": df.columns.tolist(),
        "duplicate_rows": df.duplicated().sum(),
        "missing_values": df.isnull().sum().to_dict(),
        "numeric_stats": df.describe().to_dict(),
        "categorical_stats": categorical_summary
    }
