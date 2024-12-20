from flask import Flask, jsonify, request, send_from_directory
from functools import wraps
import json
from utils.cosmos_db import CosmosDB


# TODO: initialise CosmosDB
# CosmosDB

app = Flask(__name__, static_folder='static', static_url_path='/static')

def get_username_from_request():
    username = request.args.get('user', '')
    print('get_username_from_request:', username)  # Debug print
    return username

def require_username(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print('require_username decorator called')  # Debug print
        username = get_username_from_request()
        print('username in decorator:', username)  # Debug print
        if not username:
            print('falling back to demo user')  # Debug print
            return f('demo', *args, **kwargs)
        return f(username, *args, **kwargs)
    return decorated_function


# TODO: Add CosmosDB as input and call get_models_by_username
def load_models_from_cosmos_db(username, bid_id=None):
    # Dummy implementation - replace with actual Cosmos DB query
    # In real implementation, this would use:
    # - username as partition key
    # - bid_id as optional filter
    
    demo_model = {
        'id': 'demo-model',
        'name': 'Demo: Teacher training',
        'nodes': [
            {'id': 'n1', 'label': 'Teacher Training', 'type': 'input'},
            {'id': 'n2', 'label': 'Improved Teaching Methods', 'type': 'intermediate'},
            {'id': 'n3', 'label': 'Student Engagement', 'type': 'intermediate'},
            {'id': 'n4', 'label': 'Academic Performance', 'type': 'outcome'}
        ],
        'edges': [
            {
                'id': 'e1',
                'source': 'n1',
                'target': 'n2',
                'evidence': 'Meta-analysis shows 85% correlation',
                'strength': 'high'
            },
            {
                'id': 'e2',
                'source': 'n2',
                'target': 'n3',
                'evidence': 'Multiple classroom studies',
                'strength': 'medium'
            },
            {
                'id': 'e3',
                'source': 'n3',
                'target': 'n4',
                'evidence': 'Longitudinal study data',
                'strength': 'high'
            }
        ]
    }
    
    if username == 'demo':
        return [demo_model]
    
    # TODO: get models from cosmos db and return them alongside demo_model
    return [demo_model]

# TODO: Add CosmosDB as input and call save_model
def submit_to_cosmos_db(username, model_data):
    # Dummy implementation - replace with actual Cosmos DB upload
    print(f"Would save model for user {username}: {json.dumps(model_data)}")
    return True

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/models', methods=['GET'])
@require_username
def get_models(username):
    bid_id = request.args.get('bid_id')
    models = load_models_from_cosmos_db(username, bid_id)
    return jsonify(models)

@app.route('/api/models', methods=['POST'])
@require_username
def save_model(username):
    model_data = request.json
    success = submit_to_cosmos_db(username, model_data)
    return jsonify({'success': success})

if __name__ == '__main__':
    app.run(debug=True, port=8080)