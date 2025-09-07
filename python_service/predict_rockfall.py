"""
Simplified Rockfall Prediction Service with DEM Image Processing
Calculates DEM slope angle from local image file, determines trigger and season, then uses model.pkl to predict
"""

import requests
import numpy as np
import pandas as pd
import sys
import json
import os
import joblib
from datetime import datetime
import warnings
from PIL import Image
import cv2
# from scipy import ndimage
warnings.filterwarnings('ignore')

class RockfallPredictor:
    def __init__(self, model_path='model.pkl', weather_api_key=None, 
                 dem_image_path=None, dem_bounds=None):
        """
        Initialize the rockfall predictor.
        
        Args:
            model_path: Path to the trained model.pkl file
            weather_api_key: API key for weather data
            dem_image_path: Path to the DEM image file
            dem_bounds: Dictionary with geographic bounds of DEM image
                       {'min_lat': float, 'max_lat': float, 'min_lon': float, 'max_lon': float}
        """
        self.weather_api_key = weather_api_key or os.getenv('WEATHER_API_KEY', 'your_api_key_here')
        self.model_path = model_path
        self.dem_image_path = dem_image_path
        self.dem_bounds = dem_bounds
        self.model = None
        self.dem_array = None
        self.load_model()
        self.load_dem_image()
    
    def load_model(self):
        """Load the trained model.pkl"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                print(f"Model loaded successfully from {self.model_path}", file=sys.stderr)
            else:
                raise FileNotFoundError(f"Model file {self.model_path} not found")
        except Exception as e:
            print(f"Error loading model: {e}", file=sys.stderr)
            raise e
    
    def load_dem_image(self):
        """Load and process the DEM image from Cloudinary or local path"""
        if not self.dem_image_path:
            print("Warning: No DEM image path provided. Using fallback method.", file=sys.stderr)
            return
        
        try:
            # Check if it's a Cloudinary URL or local path
            if self.dem_image_path.startswith(('http://', 'https://')):
                # Download from Cloudinary/URL
                img = self._load_image_from_url(self.dem_image_path)
            else:
                # Load from local file system
                if not os.path.exists(self.dem_image_path):
                    print(f"Warning: Local DEM image not found at {self.dem_image_path}. Using fallback method.", file=sys.stderr)
                    return
                img = Image.open(self.dem_image_path)
            
            if img is None:
                print("Error: Could not load DEM image. Using fallback method.", file=sys.stderr)
                return
            
            # Convert to grayscale if needed
            if img.mode != 'L':
                img = img.convert('L')
            
            # Convert to numpy array
            self.dem_array = np.array(img, dtype=np.float32)
            
            # Normalize elevation values (assuming the image represents elevation in grayscale)
            # You may need to adjust this scaling based on your DEM data format
            # For now, assuming grayscale values 0-255 represent elevation range
            self.dem_array = (self.dem_array / 255.0) * 3000  # Assuming max elevation of 3000m
            
            print(f"DEM image loaded successfully from {'URL' if self.dem_image_path.startswith(('http://', 'https://')) else 'local file'}. Shape: {self.dem_array.shape}", file=sys.stderr)
            
        except Exception as e:
            print(f"Error loading DEM image: {e}", file=sys.stderr)
            self.dem_array = None
    
    def _load_image_from_url(self, url):
        """Download and load image from URL (Cloudinary or other)"""
        try:
            import io
            
            # Download image from URL
            response = requests.get(url, timeout=30, stream=True)
            response.raise_for_status()  # Raise an exception for bad status codes
            
            # Check content type
            content_type = response.headers.get('content-type', '').lower()
            if not any(img_type in content_type for img_type in ['image/', 'application/octet-stream']):
                print(f"Warning: Unexpected content type: {content_type}", file=sys.stderr)
            
            # Load image from bytes
            image_bytes = io.BytesIO(response.content)
            img = Image.open(image_bytes)
            
            print(f"Successfully downloaded DEM image from URL. Size: {len(response.content)} bytes", file=sys.stderr)
            return img
            
        except requests.exceptions.RequestException as e:
            print(f"Error downloading image from URL {url}: {e}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"Error processing downloaded image: {e}", file=sys.stderr)
            return None
    
    def latlon_to_pixel(self, lat, lon):
        """Convert latitude/longitude to pixel coordinates in the DEM image"""
        if not self.dem_bounds or self.dem_array is None:
            return None, None
        
        try:
            height, width = self.dem_array.shape
            
            # Calculate pixel coordinates
            x_ratio = (lon - self.dem_bounds['min_lon']) / (self.dem_bounds['max_lon'] - self.dem_bounds['min_lon'])
            y_ratio = (self.dem_bounds['max_lat'] - lat) / (self.dem_bounds['max_lat'] - self.dem_bounds['min_lat'])
            
            pixel_x = int(x_ratio * width)
            pixel_y = int(y_ratio * height)
            
            # Ensure coordinates are within bounds
            pixel_x = max(0, min(width - 1, pixel_x))
            pixel_y = max(0, min(height - 1, pixel_y))
            
            return pixel_x, pixel_y
            
        except Exception as e:
            print(f"Error converting lat/lon to pixel: {e}", file=sys.stderr)
            return None, None
    
    def calculate_slope_angle_from_dem(self, lat, lon):
        """Calculate slope angle from DEM image at given coordinates"""
        if self.dem_array is None:
            return self._estimate_slope_fallback(lat, lon)
        
        try:
            # Convert lat/lon to pixel coordinates
            pixel_x, pixel_y = self.latlon_to_pixel(lat, lon)
            
            if pixel_x is None or pixel_y is None:
                print(f"Coordinates {lat}, {lon} are outside DEM bounds", file=sys.stderr)
                return self._estimate_slope_fallback(lat, lon)
            
            # Extract 3x3 neighborhood around the point
            height, width = self.dem_array.shape
            
            # Define window bounds
            y_min = max(0, pixel_y - 1)
            y_max = min(height, pixel_y + 2)
            x_min = max(0, pixel_x - 1)
            x_max = min(width, pixel_x + 2)
            
            # Extract elevation window
            elevation_window = self.dem_array[y_min:y_max, x_min:x_max]
            
            # Calculate slope using gradient
            return self._calculate_slope_from_elevation_window(elevation_window)
            
        except Exception as e:
            print(f"Error calculating slope from DEM: {e}", file=sys.stderr)
            return self._estimate_slope_fallback(lat, lon)
    
    def _calculate_slope_from_elevation_window(self, elevation_window):
        """Calculate slope angle from elevation window using gradients"""
        try:
            # Calculate gradients in x and y directions
            grad_y, grad_x = np.gradient(elevation_window)
            
            # Get the center gradient values
            center_y = grad_y.shape[0] // 2
            center_x = grad_x.shape[1] // 2
            
            dx = grad_x[center_y, center_x]
            dy = grad_y[center_y, center_x]
            
            # Calculate slope magnitude
            slope_radians = np.arctan(np.sqrt(dx**2 + dy**2))
            slope_degrees = np.degrees(slope_radians)
            
            # Ensure reasonable bounds
            slope_degrees = max(0, min(90, abs(slope_degrees)))
            
            return float(slope_degrees)
            
        except Exception as e:
            print(f"Error in slope calculation: {e}", file=sys.stderr)
            return 45.0  # Default moderate slope
    
    def calculate_slope_angle_advanced(self, lat, lon, method='horn'):
        """
        Advanced slope calculation using different algorithms
        
        Args:
            lat, lon: Coordinates
            method: 'horn', 'simple', 'zevenbergen' slope calculation methods
        """
        if self.dem_array is None:
            return self._estimate_slope_fallback(lat, lon)
        
        try:
            pixel_x, pixel_y = self.latlon_to_pixel(lat, lon)
            
            if pixel_x is None or pixel_y is None:
                return self._estimate_slope_fallback(lat, lon)
            
            # Extract 3x3 window
            height, width = self.dem_array.shape
            y_min = max(0, pixel_y - 1)
            y_max = min(height, pixel_y + 2)
            x_min = max(0, pixel_x - 1)
            x_max = min(width, pixel_x + 2)
            
            window = self.dem_array[y_min:y_max, x_min:x_max]
            
            if window.shape[0] < 3 or window.shape[1] < 3:
                # Pad window if near edges
                padded_window = np.pad(window, ((1, 1), (1, 1)), mode='edge')
                window = padded_window
            
            # Apply different slope calculation methods
            if method == 'horn':
                return self._horn_slope_method(window)
            elif method == 'zevenbergen':
                return self._zevenbergen_slope_method(window)
            else:
                return self._simple_slope_method(window)
                
        except Exception as e:
            print(f"Error in advanced slope calculation: {e}", file=sys.stderr)
            return self._estimate_slope_fallback(lat, lon)
    
    def _horn_slope_method(self, window):
        """Horn's method for slope calculation (most common in GIS)"""
        try:
            # Horn's formula for 3x3 window
            # dz/dx = ((c + 2f + i) - (a + 2d + g)) / (8 * cellsize)
            # dz/dy = ((g + 2h + i) - (a + 2b + c)) / (8 * cellsize)
            
            a, b, c = window[0, 0], window[0, 1], window[0, 2]
            d, e, f = window[1, 0], window[1, 1], window[1, 2]
            g, h, i = window[2, 0], window[2, 1], window[2, 2]
            
            # Assuming cell size of 1 unit for simplicity
            cellsize = 1.0
            
            dz_dx = ((c + 2*f + i) - (a + 2*d + g)) / (8 * cellsize)
            dz_dy = ((g + 2*h + i) - (a + 2*b + c)) / (8 * cellsize)
            
            slope_radians = np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
            slope_degrees = np.degrees(slope_radians)
            
            return max(0, min(90, abs(slope_degrees)))
            
        except Exception as e:
            print(f"Error in Horn's method: {e}", file=sys.stderr)
            return 45.0
    
    def _zevenbergen_slope_method(self, window):
        """Zevenbergen & Thorne method for slope calculation"""
        try:
            # Uses only orthogonal neighbors
            center = window[1, 1]
            north = window[0, 1]
            south = window[2, 1]
            east = window[1, 2]
            west = window[1, 0]
            
            cellsize = 1.0
            
            dz_dx = (east - west) / (2 * cellsize)
            dz_dy = (south - north) / (2 * cellsize)
            
            slope_radians = np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
            slope_degrees = np.degrees(slope_radians)
            
            return max(0, min(90, abs(slope_degrees)))
            
        except Exception as e:
            print(f"Error in Zevenbergen method: {e}", file=sys.stderr)
            return 45.0
    
    def _simple_slope_method(self, window):
        """Simple gradient-based slope calculation"""
        return self._calculate_slope_from_elevation_window(window)
    
    def calculate_slope_angle(self, lat, lon):
        """Main slope calculation function - uses DEM image if available"""
        return self.calculate_slope_angle_from_dem(lat, lon)
    
    def _estimate_slope_fallback(self, lat, lon):
        """Fallback slope estimation when DEM is not available"""
        base_slope = 35.0
        coord_variation = (abs(lat - 23.79) + abs(lon - 86.44)) * 1000
        slope_adjustment = (coord_variation % 30) - 15
        estimated_slope = base_slope + slope_adjustment
        return max(15.0, min(75.0, estimated_slope))
    
    def get_weather_data(self, lat, lon):
        """Get weather data from WeatherAPI"""
        try:
            url = f"http://api.weatherapi.com/v1/current.json"
            params = {
                'key': self.weather_api_key,
                'q': f"{lat},{lon}",
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                current = data['current']
                return {
                    'temperature_celsius': current['temp_c'],
                    'rainfall_mm': current.get('precip_mm', 0),
                    'humidity': current['humidity'],
                    'wind_speed_kmh': current['wind_kph'],
                    'weather_condition': current['condition']['text'],
                    'is_day': current['is_day'] == 1,
                    'pressure_mb': current['pressure_mb']
                }
            else:
                print(f"Weather API error: {response.status_code}", file=sys.stderr)
                return self._get_fallback_weather()
                
        except Exception as e:
            print(f"Weather fetch error: {e}", file=sys.stderr)
            return self._get_fallback_weather()
    
    def _get_fallback_weather(self):
        """Fallback weather data when API fails"""
        import random
        return {
            'temperature_celsius': random.uniform(20, 35),
            'rainfall_mm': random.choice([0, 0, 0, 2, 8, 15]),
            'humidity': random.randint(40, 80),
            'wind_speed_kmh': random.uniform(5, 20),
            'weather_condition': 'Clear',
            'is_day': True,
            'pressure_mb': random.randint(1010, 1020)
        }
    
    def determine_season(self, date=None):
        """Determine season based on date"""
        if date is None:
            date = datetime.now()
        
        month = date.month
        
        if month in [12, 1, 2]:
            return 'Winter'
        elif month in [3, 4, 5]:
            return 'Summer'
        elif month in [6, 7, 8, 9]:
            return 'Monsoon'
        else:
            return 'Fall'
    
    def determine_trigger(self, weather_data, slope_angle):
        """Determine trigger based on weather conditions and slope"""
        rainfall = weather_data['rainfall_mm']
        temperature = weather_data['temperature_celsius']
        condition = weather_data['weather_condition'].lower()
        humidity = weather_data['humidity']
        
        if rainfall > 5:
            return 'Precipitation'
        elif 'rain' in condition or 'storm' in condition or 'drizzle' in condition:
            return 'Precipitation'
        elif temperature > 35 and slope_angle > 55:
            return 'Light/Thermal'
        elif temperature < 5:
            return 'Light/Thermal'
        elif humidity > 85 and temperature > 25:
            return 'Precipitation'
        else:
            return 'Spontaneous'
    
    def prepare_features(self, slope_angle, season, trigger, weather_data):
        """Prepare features in the format expected by your model"""
        # season_mapping = {
        #     'Winter': 0,
        #     'Summer': 1, 
        #     'Monsoon': 2,
        #     'Fall': 3
        # }
        
        # trigger_mapping = {
        #     'Spontaneous': 0,
        #     'Precipitation': 1,
        #     'Light/Thermal': 2
        # }
        
        features = {
            "Type of slope movement": "RF",
            'Season': season,
            "min_volume": 5.0,
            "median_volume": 20.0,
            "max_volume": 50.0,
            "Relative size": "small",
            "Rock unit": "Khd",
            'slope_angle_degrees': slope_angle,
            'trigger': trigger,
        }
        
        return features
    
    def predict_rockfall_risk(self, lat, lon, slope_method='horn'):
        """Main prediction function - combines all steps"""
        try:
            # Step 1: Calculate slope angle from DEM image
            if slope_method == 'advanced':
                slope_angle = self.calculate_slope_angle_advanced(lat, lon, method='horn')
            else:
                slope_angle = self.calculate_slope_angle(lat, lon)
            
            # Step 2: Get weather data
            weather_data = self.get_weather_data(lat, lon)
            
            # Step 3: Determine season
            season = self.determine_season()
            
            # Step 4: Determine trigger
            trigger = self.determine_trigger(weather_data, slope_angle)
            
            # Step 5: Prepare features for model
            features = self.prepare_features(slope_angle, season, trigger, weather_data)
            
            # Step 6: Make prediction using model.pkl
            if self.model is None:
                raise Exception("Model not loaded")
            
            columns = [
                "Type of slope movement",
                "Season",
                "min_volume",
                "median_volume",
                "max_volume",
                "Relative size",
                "Rock unit",
                "slope_angle_degrees",
                "trigger"
            ]

            df_input = pd.DataFrame([[
                features['Type of slope movement'],
                features['Season'],
                features['min_volume'],
                features['median_volume'],
                features['max_volume'],
                features['Relative size'],
                features['Rock unit'],
                features['slope_angle_degrees'],
                features['trigger'],
            ]], columns=columns)

            # Prediction now works:
            if hasattr(self.model, 'predict_proba'):
                prediction_proba = self.model.predict_proba(df_input)
                risk_probability = prediction_proba[0][1] if len(prediction_proba[0]) > 1 else prediction_proba[0][0]
            else:
                prediction = self.model.predict(df_input)
                risk_probability = float(prediction[0])
            
            # Categorize risk level
            if risk_probability >= 0.8:
                risk_level = 'CRITICAL'
            elif risk_probability >= 0.6:
                risk_level = 'HIGH'
            elif risk_probability >= 0.4:
                risk_level = 'MEDIUM'
            elif risk_probability >= 0.2:
                risk_level = 'LOW'
            else:
                risk_level = 'MINIMAL'
            
            # Prepare response
            result = {
                'coordinates': {'lat': lat, 'lon': lon},
                'slope_angle_degrees': round(slope_angle, 2),
                'slope_calculation_method': 'DEM_image' if self.dem_array is not None else 'fallback_estimation',
                'season': season,
                'trigger': trigger,
                'weather': {
                    'temperature_celsius': round(weather_data['temperature_celsius'], 1),
                    'rainfall_mm': round(weather_data['rainfall_mm'], 1),
                    'humidity': weather_data['humidity'],
                    'condition': weather_data['weather_condition']
                },
                'features_used': features,
                'risk_probability': round(float(risk_probability), 4),
                'risk_level': risk_level,
                'prediction_timestamp': datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            return {
                'error': str(e),
                'coordinates': {'lat': lat, 'lon': lon},
                'timestamp': datetime.now().isoformat()
            }

def load_config_from_json(json_file_path):
    """Load configuration from JSON file sent by Node.js server"""
    try:
        with open(json_file_path, 'r') as f:
            config = json.load(f)
        
        # Validate required fields
        required_fields = ['lat', 'lon', 'dem_image_path']
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Missing required field: {field}")
        
        return config
        
    except FileNotFoundError:
        raise FileNotFoundError(f"Configuration file not found: {json_file_path}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format in config file: {e}")
    except Exception as e:
        raise Exception(f"Error loading config: {e}")

def process_batch_predictions(config_list):
    """Process multiple predictions from a list of configurations"""
    results = []
    
    for i, config in enumerate(config_list):
        try:
            # Extract configuration
            lat = float(config['lat'])
            lon = float(config['lon'])
            dem_image_path = config['dem_image_path']
            dem_bounds = config.get('dem_bounds')
            model_path = config.get('model_path', 'model.pkl')
            weather_api_key = config.get('weather_api_key')
            slope_method = config.get('slope_method', 'advanced')
            
            # Create predictor for this configuration
            predictor = RockfallPredictor(
                model_path=model_path,
                weather_api_key=weather_api_key,
                dem_image_path=dem_image_path,
                dem_bounds=dem_bounds
            )
            
            # Make prediction
            result = predictor.predict_rockfall_risk(lat, lon, slope_method=slope_method)
            result['config_index'] = i
            results.append(result)
            
        except Exception as e:
            results.append({
                'config_index': i,
                'error': str(e),
                'coordinates': (config.get('lat'), config.get('lon')),
                'timestamp': datetime.now().isoformat()
            })
    
    return results

# Command line interface for Node.js integration
def main():
    """Main function for backend usage via JSON on stdin"""
    
    try:
        # Read the JSON input from standard input
        json_input = sys.stdin.read()
        if not json_input.strip():
            print(json.dumps({"error": "No input received"}), file=sys.stderr)
            sys.exit(1)
        config_data = json.loads(json_input)



        dem_bounds_dict= {
            "min_lat": 37.63,
            "max_lat": 38.16,
            "min_lon": 119.17,
            "max_lon": 119.90
        }

        data = json.loads(json_input)
        
        if isinstance(data, list) and len(data) > 0:
            config_data = data[0]  # Get first location
        else:
            config_data = data



        # Extract parameters from the JSON config
        lat = float(config_data.get('lat'))
        lon = float(config_data.get('lon'))
        dem_image_path = config_data.get('dem_image_path')
        dem_bounds = dem_bounds_dict
        model_path = "../ml_training/model.pkl"
        weather_api_key = "02c178e38a1d4f3d801181800250609"
        slope_method = "advanced"

        # Check for required parameters
        if lat is None or lon is None:
            raise ValueError("Latitude and longitude must be provided in the JSON input.")

        # Create predictor
        predictor = RockfallPredictor(
            model_path=model_path, 
            weather_api_key=weather_api_key,
            dem_image_path=dem_image_path,
            dem_bounds=dem_bounds
        )
        
        # Make prediction
        result = predictor.predict_rockfall_risk(lat, lon, slope_method=slope_method)
        
        # Output JSON result to stdout
        print(json.dumps(result, indent=2))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'error': f'Invalid JSON input: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'error': f'Prediction failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()