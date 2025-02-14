import os
import uuid
import pandas as pd
import google.generativeai as genai
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pathlib import Path
import re
import numpy as np
from datetime import datetime

# Configuration
UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx'}
SESSION_DATA = {}  # Stores dataframes and analysis results

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Configure Gemini
genai.configure(api_key="AIzaSyBsrKccpnI9gRINX_DE775mWD0BcVZjt0w")
model = genai.GenerativeModel('gemini-pro')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def handle_upload():
    """Handle file upload and sample dataset requests"""
    try:
        # Debug: Log request data
        app.logger.debug(f"Received upload request. Form data: {request.form}, Files: {request.files}")
        
        # Check for sample dataset request
        if request.form.get('sample') == 'true':
            app.logger.debug("Handling sample dataset request")
            sample_path = Path('SAMPLE_DATA.csv')
            
            if not sample_path.exists():
                app.logger.error("Sample data file not found")
                return jsonify({'error': 'Sample data file missing'}), 500
            
            df = pd.read_csv(sample_path)
            session_id = str(uuid.uuid4())
            
            SESSION_DATA[session_id] = {
                'df': df,
                'preview': df.head().to_dict(),
                'shape': df.shape,
                'processed': False
            }
            
            return jsonify({
                'session_id': session_id,
                'preview': SESSION_DATA[session_id]['preview'],
                'shape': df.shape,
                'message': 'Sample dataset loaded'
            })

        # Handle file upload
        if 'file' not in request.files:
            app.logger.error("No file part in request")
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        if file.filename == '':
            app.logger.error("Empty filename")
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            session_id = str(uuid.uuid4())
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            app.logger.debug(f"File saved to: {filepath}")
            
            try:
                if filename.endswith(".csv"):
                    df = pd.read_csv(filepath)
                else:
                    df = pd.read_excel(filepath)
            except Exception as e:
                app.logger.error(f"Error reading file: {str(e)}")
                return jsonify({'error': 'Invalid file format'}), 400
            
            SESSION_DATA[session_id] = {
                'df': df,
                'filepath': filepath,
                'preview': df.head().to_dict(),
                'shape': df.shape,
                'processed': False
            }
            
            return jsonify({
                'session_id': session_id,
                'preview': SESSION_DATA[session_id]['preview'],
                'shape': df.shape,
                'message': 'File uploaded successfully'
            })

        app.logger.error(f"Invalid file type: {file.filename}")
        return jsonify({'error': 'Invalid file type'}), 400
    
    except Exception as e:
        app.logger.error(f"Server error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/analyze/<session_id>', methods=['POST'])
def generate_analysis(session_id):
    """Generate AI recommendations"""
    app.logger.debug(f"Session data: {SESSION_DATA}")
    
    if session_id not in SESSION_DATA:
        app.logger.error(f"Invalid session ID: {session_id}")
        return jsonify({'error': 'Invalid session'}), 404
    
    data = request.json
    business_problem = data.get('business_problem')
    processing_goal = data.get('processing_goal')
    custom_goal = data.get('custom_goal', '')
    
    if not business_problem:
        return jsonify({'error': 'Business problem required'}), 400
    
    try:
        df = SESSION_DATA[session_id]['df']
        goal = processing_goal if processing_goal != "Other (specify below)" else custom_goal
        
        # Same analysis logic as original Gradio version
        df_analysis = f"""
        Dataset Overview:
        - Total Rows: {df.shape[0]}
        - Total Columns: {df.shape[1]}
        - Columns: {', '.join(df.columns)}
        
        Data Types:
        {df.dtypes.to_string()}
        
        Missing Values:
        {df.isnull().sum().to_string()}
        
        Sample Data:
        {df.head().to_string()}
        
        Numerical Columns Summary:
        {df.describe().to_string()}
        """
        
        prompt = f"""
        Analyze this specific dataset and provide targeted recommendations:
        Business Problem: {business_problem}
        Processing Goal: {goal}
        Dataset Analysis: {df_analysis}
        ... (rest of original prompt) ...
        """
        
        response = model.generate_content(prompt)
        SESSION_DATA[session_id]['processed'] = True
        return jsonify({
            'analysis': response.text,
            'session_id': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/apply/<session_id>', methods=['POST'])
def apply_recommendations(session_id):
    """Apply AI recommendations to dataset"""
    try:
        if session_id not in SESSION_DATA:
            return jsonify({'error': 'Invalid session'}), 404
            
        data = request.json
        recommendations = data.get('recommendations', '')
        session_data = SESSION_DATA[session_id]
        df = session_data['df'].copy()
        filepath = session_data.get('filepath')
        
        # Split recommendations into individual actions
        recommendations = [line.strip() for line in recommendations.split('\n') if line.strip()]
        
        # Process recommendations
        df, results = handle_recommendations(df, recommendations)
        
        # Save the modified dataframe back to file
        if filepath:
            if filepath.endswith('.csv'):
                df.to_csv(filepath, index=False)
            else:
                df.to_excel(filepath, index=False)
        
        # Update session data
        SESSION_DATA[session_id]['df'] = df
        SESSION_DATA[session_id]['preview'] = df.head().to_dict()
        SESSION_DATA[session_id]['processed'] = True
        
        return jsonify({
            'message': 'Recommendations processed',
            'results': results,
            'updatedData': {
                'preview': SESSION_DATA[session_id]['preview'],
                'shape': df.shape,
                'downloadAvailable': True
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<session_id>')
def download_file(session_id):
    """Download processed dataset"""
    try:
        if session_id not in SESSION_DATA:
            return jsonify({'error': 'Invalid session'}), 404
            
        filepath = SESSION_DATA[session_id].get('filepath')
        if not filepath or not Path(filepath).exists():
            return jsonify({'error': 'File not found'}), 404
            
        return send_file(
            filepath,
            as_attachment=True,
            download_name=Path(filepath).name
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/apply-quick/<session_id>', methods=['POST'])
def apply_quick_action(session_id):
    """Handle quick action application"""
    try:
        if session_id not in SESSION_DATA:
            return jsonify({'error': 'Invalid session'}), 404
            
        data = request.json
        action = data.get('action', '')
        session_data = SESSION_DATA[session_id]
        df = session_data['df'].copy()
        
        # Process single action
        df, results = handle_recommendations(df, [action])
        
        # Save changes
        filepath = session_data.get('filepath')
        if filepath:
            if filepath.endswith('.csv'):
                df.to_csv(filepath, index=False)
            else:
                df.to_excel(filepath, index=False)
        
        # Update session data
        SESSION_DATA[session_id]['df'] = df
        SESSION_DATA[session_id]['preview'] = df.head().to_dict()
        SESSION_DATA[session_id]['processed'] = True
        
        return jsonify({
            'message': 'Quick action applied',
            'updatedData': {
                'preview': SESSION_DATA[session_id]['preview'],
                'shape': df.shape,
                'downloadAvailable': True
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def handle_recommendations(df, recommendations):
    """Process recommendations with validation and error handling"""
    results = {
        'applied': [],
        'skipped': [],
        'errors': []
    }
    
    # Define recommendation handlers
    handlers = [
        {
            'pattern': r'drop missing values',
            'func': lambda df: df.dropna(),
            'type': 'destructive'
        },
        {
            'pattern': r"rename column '(.+?)' to '(.+?)'",
            'func': lambda df, old, new: df.rename(columns={old: new}),
            'type': 'modification'
        },
        {
            'pattern': r"convert column '(.+?)' to (numeric|datetime)",
            'func': lambda df, col, dtype: convert_column_type(df, col, dtype),
            'type': 'modification'
        },
        {
            'pattern': r"standardize text in column '(.+?)'",
            'func': lambda df, col: df.assign(**{col: df[col].str.lower().str.strip()}),
            'type': 'modification'
        },
        {
            'pattern': r"create new feature '(.+?)' as (.+)",
            'func': lambda df, name, expr: create_new_feature(df, name, expr),
            'type': 'addition'
        },
        {
            'pattern': r"filter rows where (.+)",
            'func': lambda df, condition: filter_rows(df, condition),
            'type': 'destructive'
        },
        {
            'pattern': r"remove duplicates in column '(.+?)'",
            'func': lambda df, col: df.drop_duplicates(subset=[col]),
            'type': 'destructive'
        },
        {
            'pattern': r'remove duplicate rows',
            'func': lambda df: df.drop_duplicates(),
            'type': 'destructive'
        },
        {
            'pattern': r'convert text columns to lowercase',
            'func': lambda df: df.transform(lambda x: x.str.lower() if x.dtype == 'object' else x),
            'type': 'modification'
        },
        {
            'pattern': r'standardize date formats',
            'func': lambda df: standardize_dates(df),
            'type': 'modification'
        }
    ]

    # Process each recommendation
    for rec in recommendations:
        try:
            applied = False
            for handler in handlers:
                match = re.search(handler['pattern'], rec, re.IGNORECASE)
                if match:
                    # Validate before execution
                    if validate_recommendation(df, handler, match):
                        df = handler['func'](df, *match.groups())
                        results['applied'].append(rec)
                        applied = True
                        break
            if not applied:
                results['skipped'].append(rec)
        except Exception as e:
            results['errors'].append(f"{rec} - {str(e)}")
    
    return df, results

def validate_recommendation(df, handler, match):
    """Validate recommendation parameters"""
    # Check for required columns
    if 'column' in handler.get('checks', []):
        col = match.group(1)
        if col not in df.columns:
            raise ValueError(f"Column '{col}' not found")
    
    # Add more validation rules as needed
    return True

def convert_column_type(df, col, dtype):
    """Safe type conversion with validation"""
    if col not in df.columns:
        raise ValueError(f"Column '{col}' not found")
    
    if dtype == 'numeric':
        df[col] = pd.to_numeric(df[col], errors='coerce')
    elif dtype == 'datetime':
        df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # Verify conversion
    if not np.issubdtype(df[col].dtype, np.number) and dtype == 'numeric':
        raise ValueError(f"Failed to convert {col} to numeric")
    
    return df

def create_new_feature(df, name, expr):
    """Safe feature creation with validation"""
    try:
        # Limited safe evaluation context
        ctx = {
            'df': df,
            'np': np,
            'datetime': datetime
        }
        df[name] = pd.eval(expr, local_dict=ctx)
    except:
        raise ValueError(f"Invalid expression: {expr}")
    
    if name not in df.columns:
        raise ValueError(f"Failed to create feature '{name}'")
    
    return df

def filter_rows(df, condition):
    """Safe row filtering with validation"""
    try:
        ctx = {
            'df': df,
            'np': np,
            'datetime': datetime
        }
        mask = pd.eval(condition, local_dict=ctx)
        return df[mask]
    except:
        raise ValueError(f"Invalid filter condition: {condition}")

def standardize_dates(df):
    for col in df.select_dtypes(include=['object']):
        try:
            df[col] = pd.to_datetime(df[col])
        except:
            continue
    return df

if __name__ == '__main__':
    app.run(debug=True, port=5000)