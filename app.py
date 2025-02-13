import os
import uuid
import pandas as pd
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pathlib import Path

# Configuration
UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx'}
SESSION_DATA = {}  # Stores dataframes and analysis results

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

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
def generate_analysis(session_id):
    """Generate AI recommendations"""
    if session_id not in SESSION_DATA:
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
        return jsonify({
            'analysis': response.text,
            'session_id': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)