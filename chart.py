import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import mysql.connector
from fastapi import FastAPI, HTTPException
import uvicorn

class BioZPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.scaler = StandardScaler()
        self.feature_names = None  # Store training feature names

    def connect_database(self):
        """Database connection"""
        return mysql.connector.connect(
            host='localhost',
            user='root',
            password='root',
            database='careflex'
        )

    def fetch_training_data(self):
        """Fetch data from Bio table"""
        try:
            connection = self.connect_database()
            query = """
            SELECT 
                DATE(dateandtime) AS date, 
                HOUR(dateandtime) AS hour, 
                biodata AS av_bio_value,
                CASE 
                    WHEN biodata < 1400 THEN 'Healing'
                    WHEN biodata > 1600 THEN 'Infection'
                    ELSE 'Normal'
                END AS health_status
            FROM Bio
            ORDER BY dateandtime DESC
            LIMIT 1000
            """
            
            df = pd.read_sql_query(query, connection)
            connection.close()
            return df
        except Exception as e:
            print(f"Database Error: {e}")
            return None

    def train_model(self):
        """Train the ML model"""
        df = self.fetch_training_data()
        if df is None or df.empty:
            raise Exception("No training data available")
        
        # One-hot encode categorical features
        df_encoded = pd.get_dummies(df, columns=['date', 'hour'])
        
        # Prepare features and target
        X = df_encoded.drop(['health_status', 'av_bio_value'], axis=1)
        y = df_encoded['health_status']
        
        # Store feature names for future prediction
        self.feature_names = X.columns
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)

    def predict_health_status(self, date, hour, av_bio_value):
        """Predict health status"""
        input_data = pd.DataFrame({
            'date': [date],
            'hour': [hour],
            'av_bio_value': [av_bio_value]
        })
        
        # One-hot encode input
        input_encoded = pd.get_dummies(input_data, columns=['date', 'hour'])
        
        # Align columns with training data
        input_encoded = input_encoded.reindex(columns=self.feature_names, fill_value=0)
        
        # Scale input
        input_scaled = self.scaler.transform(input_encoded)
        
        # Predict
        prediction = self.model.predict(input_scaled)[0]
        
        # Recommendations
        suggestions = {
            'Healing': {'status': 'Good', 'recommendation': 'Continue treatment.'},
            'Infection': {'status': 'Critical', 'recommendation': 'Seek medical attention immediately.'},
            'Normal': {'status': 'Stable', 'recommendation': 'Regular monitoring is advised.'}
        }
        
        return suggestions[prediction]

# FastAPI Application
app = FastAPI()
predictor = BioZPredictor()

@app.post("/predict")
async def predict_health(date: str, hour: int, av_bio_value: float):
    try:
        predictor.train_model()
        result = predictor.predict_health_status(date, hour, av_bio_value)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
