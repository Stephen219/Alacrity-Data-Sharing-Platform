import pandas as pd
import numpy as np
import json

def calculate_descriptive_statistics(df):
    try:
        if df is None or not isinstance(df, pd.DataFrame):
            raise ValueError("Input must be a pandas DataFrame")

        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns

        numeric_stats = df[numeric_cols].describe().to_dict()

        for col, stats in numeric_stats.items():
            for stat, value in stats.items():
                if isinstance(value, (np.int64, np.float64)):
                    stats[stat] = value.item()  
                elif isinstance(value, pd.Timestamp):
                    stats[stat] = str(value)  

        categorical_summary = {}
        for col in categorical_cols:
            categorical_summary[col] = {
                "unique": df[col].nunique(),
                "top": df[col].mode()[0],
                "freq": df[col].value_counts().iloc[0]
            }

        result = {
            "numeric_stats": numeric_stats,
            # "categorical_stats": categorical_summary
        }

        def convert_to_serializable(obj):
            if isinstance(obj, (np.int64, np.float64)):
                return obj.item()  
            elif isinstance(obj, pd.Timestamp):
                return str(obj)  
            elif isinstance(obj, dict):
                return {key: convert_to_serializable(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_serializable(item) for item in obj]
            return obj  

        result_serializable = convert_to_serializable(result)

        return result_serializable
    
    except Exception as e:
        return {"error": str(e)}


