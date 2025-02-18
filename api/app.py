import os
import uuid
import pandas as pd
import google.generativeai as genai
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pathlib import Path
import pickle
import time
import numpy as np
from datetime import datetime
import json
import traceback  # Add this import
import io
import random

# Configuration
UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx'}
SESSION_DATA = {}  # Stores dataframes and analysis results

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Configure Gemini API
GOOGLE_API_KEY = 'AIzaSyBsrKccpnI9gRINX_DE775mWD0BcVZjt0w'  # Better to use environment variable
genai.configure(api_key=GOOGLE_API_KEY)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def handle_upload():
    """Handle file upload and create session"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        try:
            # Create session
            session_id = str(uuid.uuid4())
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            
            # Save file
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Read data
            if filename.endswith(".csv"):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Store in session
            SESSION_DATA[session_id] = {
                'df': df,
                'filepath': filepath,
                'preview': df.head().to_dict(),
                'shape': df.shape
            }
            
            return jsonify({
                'session_id': session_id,
                'preview': SESSION_DATA[session_id]['preview'],
                'shape': SESSION_DATA[session_id]['shape'],
                'message': 'File uploaded successfully'
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/analyze/<session_id>', methods=['POST'])
def analyze(session_id):
    if session_id not in SESSION_DATA:
        return jsonify({'error': 'Session not found'}), 404

    data = request.json
    df = SESSION_DATA[session_id]['df']
    
    # Convert DataFrame info to JSON-serializable format
    data_summary = {
        'columns': list(df.columns),
        'sample_data': df.head().to_dict('records'),
        'data_types': df.dtypes.astype(str).to_dict(),
        'missing_values': df.isnull().sum().to_dict(),
        'business_problem': data.get('business_problem'),
        'processing_goal': data.get('processing_goal')
    }

    try:
        # Convert data_summary to string
        json_safe_summary = json.dumps(data_summary, default=str)
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-pro')
        
        # Create prompt for analysis with explicit formatting instructions
        prompt = f"""
        As a data analysis expert, analyze this dataset and provide specific, actionable recommendations 
        for data processing. Focus on data quality, cleaning, and preparation steps.
        
        Dataset Information:
        {json_safe_summary}
        
        Please provide recommendations in this exact format (without any asterisks or special characters):
        examples:-
        1. Remove Duplicate Data
        [Explanation of duplicate data handling]
        
        2. Handle Missing Values
        [Explanation of missing value treatment]
        
        Important: 
        - so apart from the given examples, give actual recommendations , maximum 5 recommendations
        - Do not use any asterisks (*) or special characters
        - Start each recommendation with a number followed by a period
        - Keep titles clear and concise
        - Provide detailed explanations under each title
        - give actual recommendations
        """
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Extract recommendations
        analysis = response.text
        
        # Clean up any remaining asterisks (just in case)
        analysis = analysis.replace('*', '')
        analysis = analysis.replace('**', '')
        
        SESSION_DATA[session_id]['analysis'] = analysis
        return jsonify({'analysis': analysis}), 200
        
    except Exception as e:
        print(f"Error in analyze: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/train/<session_id>', methods=['POST'])
def train_model(session_id):
    if session_id not in SESSION_DATA:
        return jsonify({'error': 'Session not found'}), 404

    data = request.json
    algorithm = data.get('algorithm')
    
    # Simulate training delay
    time.sleep(2)
    
    # Store trained model info
    SESSION_DATA[session_id]['model'] = {
        'algorithm': algorithm,
        'trained': True
    }
    
    return jsonify({'status': 'success'}), 200

@app.route('/download-model/<session_id>/<model_name>', methods=['GET'])
def download_model(session_id, model_name):
    try:
        # Here you would typically fetch the actual model file
        # For demo purposes, we'll create a dummy model file
        model_content = f"Model: {model_name}\nSession: {session_id}\nTimestamp: {datetime.now()}"
        
        return Response(
            model_content,
            mimetype='application/octet-stream',
            headers={'Content-Disposition': f'attachment;filename={model_name.lower().replace(" ", "_")}.pkl'}
        )
    except Exception as e:
        print(f"Download error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/host-model/<session_id>', methods=['POST'])
def host_model(session_id):
    if session_id not in SESSION_DATA:
        return jsonify({'error': 'Session not found'}), 404

    # Generate API key and endpoint
    api_key = str(uuid.uuid4())
    endpoint = f'https://api.example.com/predict/{session_id}'
    
    return jsonify({
        'api_key': api_key,
        'endpoint': endpoint
    }), 200

@app.route('/apply-quick/<session_id>', methods=['POST'])
def apply_quick_action(session_id):
    if session_id not in SESSION_DATA:
        return jsonify({'error': 'Session not found'}), 404

    data = request.json
    action = data.get('action')
    df = SESSION_DATA[session_id]['df'].copy()

    try:
        # Generate a unique filename for this processed data
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'processed_{session_id}_{timestamp}.csv'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Apply the requested action
        if 'Drop missing values' in action:
            df = df.dropna()
        elif 'Remove duplicate rows' in action:
            df = df.drop_duplicates()
        elif 'Convert text columns to lowercase' in action:
            text_columns = df.select_dtypes(include=['object']).columns
            for col in text_columns:
                df[col] = df[col].str.lower()
        elif 'Standardize date formats' in action:
            # Add your date standardization logic here
            pass
        elif 'Create new feature "age_group"' in action:
            df['age_group'] = pd.cut(df['Age'], bins=[0,18,35,50,100])
        elif 'Convert column "price" to numeric' in action:
            df['price'] = pd.to_numeric(df['price'], errors='coerce')
        elif 'Create ratio feature' in action:
            df['price_per_sqft'] = df['Price'] / df['SquareFeet']
        elif 'Filter rows where age < 0' in action:
            df = df[df['age'] >= 0]
        elif 'Validate email format' in action:
            df['valid_email'] = df['email'].str.match(r'^[\w\.-]+@[\w\.-]+\.\w+$')
        elif 'Check for outliers' in action:
            # Add your outlier detection logic here
            pass

        # Save the processed DataFrame
        df.to_csv(file_path, index=False)
        
        # Update session data
        SESSION_DATA[session_id]['df'] = df
        SESSION_DATA[session_id]['processed_files'] = SESSION_DATA[session_id].get('processed_files', [])
        SESSION_DATA[session_id]['processed_files'].append(filename)
        
        # Convert DataFrame to JSON-safe format
        preview_data = df.head().to_dict('records')
        
        return jsonify({
            'preview': preview_data,
            'shape': list(df.shape),  # Convert tuple to list
            'filename': filename
        }), 200

    except Exception as e:
        print(f"Error in apply_quick: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

@app.route('/download-processed/<session_id>/<filename>', methods=['GET'])
def download_processed(session_id, filename):
    if session_id not in SESSION_DATA:
        return jsonify({'error': 'Session not found'}), 404

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download-final/<session_id>', methods=['GET'])
def download_final(session_id):
    try:
        # Create a simple sample DataFrame
        sample_data = {
            'Column1': [1, 2, 3, 4, 5],
            'Column2': ['A', 'B', 'C', 'D', 'E'],
            'Column3': [1.1, 2.2, 3.3, 4.4, 5.5]
        }
        df = pd.DataFrame(sample_data)
        
        # Create buffer
        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'processed_data_{timestamp}.csv'

        return send_file(
            io.BytesIO(buffer.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        print(f"Download error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/apply-recommendations/<session_id>', methods=['POST'])
def apply_recommendations(session_id):
    if session_id not in SESSION_DATA:
        return jsonify({'error': 'Session not found'}), 404

    try:
        df = SESSION_DATA[session_id]['df'].copy()
        
        # Apply common data cleaning steps
        # 1. Remove duplicates
        df = df.drop_duplicates()
        
        # 2. Handle missing values
        df = df.dropna()
        
        # 3. Convert datatypes appropriately
        numeric_columns = df.select_dtypes(include=['object']).columns
        for col in numeric_columns:
            try:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            except:
                continue
                
        # Save processed DataFrame
        SESSION_DATA[session_id]['df'] = df
        
        # Return preview and shape
        return jsonify({
            'preview': df.head().to_dict('records'),
            'shape': list(df.shape)
        }), 200
        
    except Exception as e:
        print(f"Error in apply_recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/refine-model/<session_id>', methods=['POST'])
def refine_model(session_id):
    try:
        parameters = request.json
        
        # Simulate model refinement with random improvements
        
        # Generate slightly improved metrics based on parameters
        base_improvement = random.uniform(0.1, 2.0)
        learning_rate_factor = 1 + (0.1 - parameters['learningRate']) * 10
        epoch_factor = parameters['epochs'] / 100
        batch_factor = 32 / parameters['batchSize']
        
        improvement = base_improvement * learning_rate_factor * epoch_factor * batch_factor
        
        # Return simulated performance metrics
        return jsonify({
            'performance': {
                'accuracy': min(99, 85 + improvement),
                'precision': min(99, 83 + improvement * 0.9),
                'recall': min(99, 87 + improvement * 1.1),
                'f1Score': min(99, 85 + improvement)
            }
        }), 200
        
    except Exception as e:
        print(f"Refinement error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/train-models/<session_id>', methods=['POST'])
def train_models(session_id):
    try:
        # Simulate longer training time (3 seconds)
        time.sleep(5)
        
        # No need to get api_key here since we're just training
        
        # Simulate model training
        models = [
            {
                'name': 'Model V1',
                'algorithm': 'Random Forest',
                'accuracy': 92.4,
                'hyperparameters': 'n_estimators=200, max_depth=10',
                'training_time': '12s'
            },
            {
                'name': 'Model V2',
                'algorithm': 'XGBoost',
                'accuracy': 91.8,
                'hyperparameters': 'learning_rate=0.05, max_depth=6',
                'training_time': '15s'
            },
            {
                'name': 'Model V3',
                'algorithm': 'Logistic Regression',
                'accuracy': 88.2,
                'hyperparameters': 'C=1.0, solver=lbfgs',
                'training_time': '5s'
            },
            {
                'name': 'Model V4',
                'algorithm': 'SVM',
                'accuracy': 85.5,
                'hyperparameters': 'kernel=rbf, C=1.0, gamma=scale',
                'training_time': '20s'
            }
        ]
        
        # Sort models by accuracy
        models.sort(key=lambda x: x['accuracy'], reverse=True)
        
        return jsonify({'models': models}), 200
        
    except Exception as e:
        print(f"Training error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/deploy-model/<session_id>', methods=['POST'])
def deploy_model(session_id):
    try:
        data = request.json
        model_name = data.get('model_name')
        api_key = data.get('api_key')
        
        # Here you would typically handle the actual model deployment
        # For demo purposes, we'll return a mock endpoint
        endpoint = f"https://api.example.com/models/{model_name.lower().replace(' ', '-')}"
        
        return jsonify({
            'status': 'success',
            'message': f'Model {model_name} deployed successfully',
            'endpoint': endpoint
        }), 200
        
    except Exception as e:
        print(f"Deployment error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Make sure uploads folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

if __name__ == '__main__':
    app.run(debug=True, port=5000)