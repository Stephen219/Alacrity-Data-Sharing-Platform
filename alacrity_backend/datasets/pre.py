import pandas as pd
import numpy as np
import json
 
def pre_analysis(df):
    """Perform pre-analysis on a given DataFrame and return statistics in a structured format."""
    try:
       
        if df is None or not isinstance(df, pd.DataFrame):
            raise ValueError("Input must be a pandas DataFrame")
 
        total_rows = int(len(df))
        duplicate_rows = int(df.duplicated().sum())
        missing_values = {col: int(val) for col, val in df.isnull().sum().to_dict().items()}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns
        numeric_stats = df[numeric_cols].describe().applymap(lambda x: float(x) if isinstance(x, (np.integer, np.floating)) else x).to_dict()
        categorical_summary = {
            col: {
                "unique": int(df[col].nunique()),
                "top": df[col].mode()[0] if not df[col].mode().empty else None,
                "freq": int(df[col].value_counts().iloc[0]) if not df[col].value_counts().empty else 0
            }
            for col in categorical_cols
        }
 
        return {
            "total_rows": total_rows,
            "columns": list(df.columns),
            "duplicate_rows": duplicate_rows,
            "missing_values": missing_values,
        
            "categorical_stats": categorical_summary
        }
 
    except Exception as e:
        return {"error": str(e)}