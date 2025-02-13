from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import mysql.connector
import pandas as pd
from datetime import datetime, timedelta

class BioZ24HourMonitor:
    def __init__(self):
        # Constants for ranges
        self.OPTIMAL_RANGE = (499950, 500050)
        self.NORMAL_RANGE = (499900, 500100)
        self.CAUTION_RANGE = (499850, 500150)
        self.WARNING_RANGE = (499800, 500200)
        
        # Database configuration
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'root',
            'database': 'careflex'
        }

    def connect_database(self):
        """Establish database connection"""
        try:
            return mysql.connector.connect(**self.db_config)
        except mysql.connector.Error as err:
            raise HTTPException(
                status_code=500,
                detail=f"Database connection error: {str(err)}"
            )

    def fetch_last_24h_data(self) -> dict:
        """Fetch last 24 hours of data from database"""
        try:
            connection = self.connect_database()
            cursor = connection.cursor(dictionary=True)
            current_time = datetime.now()
            start_time = current_time - timedelta(hours=24)

            query = """
                SELECT 
                    date,
                    hour,
                    av_bio_value as adc_value,
                    timestamp
                FROM bio_permanent
                WHERE timestamp >= %s
                ORDER BY timestamp
            """

            cursor.execute(query, (start_time,))
            rows = cursor.fetchall()
            cursor.close()
            connection.close()

            if not rows:
                raise HTTPException(status_code=404, detail="No data found for the last 24 hours")

            # Convert data to lists
            timestamps = [row["timestamp"].strftime('%Y-%m-%d %H:%M:%S') for row in rows]
            values = [float(row["adc_value"]) for row in rows]
            latest_value = values[-1]

            return {
                'timestamps': timestamps,
                'values': values,
                'latest_value': latest_value
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching data: {str(e)}"
            )

    def get_status_and_advice(self, adc_value: float) -> dict:
        """Determine status and provide appropriate advice"""
        if self.OPTIMAL_RANGE[0] <= adc_value <= self.OPTIMAL_RANGE[1]:
            return {
                'status': 'Optimal',
                'color': 'green',
                'message': 'Values are in optimal range',
                'actions': [
                    'Continue regular monitoring',
                    'Maintain current care routine',
                    'Record readings as usual'
                ]
            }
        elif self.NORMAL_RANGE[0] <= adc_value <= self.NORMAL_RANGE[1]:
            return {
                'status': 'Normal',
                'color': 'blue',
                'message': 'Values are within normal range',
                'actions': [
                    'Monitor regularly',
                    'Maintain good hygiene',
                    'Continue normal activities'
                ]
            }
        elif self.CAUTION_RANGE[0] <= adc_value <= self.CAUTION_RANGE[1]:
            return {
                'status': 'Caution',
                'color': 'orange',
                'message': 'Values show slight variation',
                'actions': [
                    'Increase monitoring frequency',
                    'Check for any discomfort',
                    'Review recent activities',
                    'Consider consulting healthcare provider if persistent'
                ]
            }
        elif self.WARNING_RANGE[0] <= adc_value <= self.WARNING_RANGE[1]:
            return {
                'status': 'Attention Needed',
                'color': 'red',
                'message': 'Values outside normal range',
                'actions': [
                    'Contact healthcare provider',
                    'Monitor more frequently',
                    'Document any symptoms',
                    'Avoid strenuous activities'
                ]
            }
        else:
            return {
                'status': 'Critical Condition',
                'color': 'dark red',
                'message': 'Extreme values detected! Immediate action required!',
                'actions': [
                    'Seek emergency medical attention immediately',
                    'Stop all activities and rest',
                    'Ensure hydration and proper environment',
                    'Call emergency services if symptoms worsen'
                ]
            }

    def get_24h_data(self) -> dict:
        """Get the complete 24-hour data with analysis"""
        try:
            data = self.fetch_last_24h_data()
            status_info = self.get_status_and_advice(data['latest_value'])
            
            return {
                'data': data,
                'analysis': status_info,
                'ranges': {
                    'optimal': self.OPTIMAL_RANGE,
                    'normal': self.NORMAL_RANGE,
                    'caution': self.CAUTION_RANGE,
                    'warning': self.WARNING_RANGE
                }
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating data: {str(e)}"
            )

# FastAPI Application
app = FastAPI(title="24-Hour BioZ Monitor")
monitor = BioZ24HourMonitor()

@app.post("/data/24h")
async def fetch_24h_data():
    """Get last 24 hours data with analysis"""
    try:
        data = monitor.get_24h_data()
        return JSONResponse(content=data)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Corrected __main__ check
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
