import os
from azure.cosmos import CosmosClient, PartitionKey
from dotenv import load_dotenv

load_dotenv()

class CosmosDB:
    def __init__(self):
        self.client = CosmosClient(
            os.getenv("COSMOS_ENDPOINT"),
            os.getenv("COSMOS_KEY")
        )
        self.database = self.client.get_database_client(os.getenv("COSMOS_DATABASE"))
        self.container = self.database.get_container_client(os.getenv("COSMOS_CONTAINER"))

    def get_models_by_username(self, username, bid_id=None):
        query = "SELECT * FROM c WHERE c.username = @username"
        parameters = [{"name": "@username", "value": username}]
        
        if bid_id:
            query += " AND c.bid_id = @bid_id"
            parameters.append({"name": "@bid_id", "value": bid_id})
        
        return list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=False  # More efficient with partition key
        ))

    def save_model(self, model_data):
        return self.container.upsert_item(model_data)

# Usage example:
"""
# Initialize database
cosmos_db = CosmosDB()

# Get models
models = cosmos_db.get_models_by_username('username123')

# Save model
model_data = {
    'id': 'model-123',
    'username': 'username123',  # Partition key
    'name': 'My Logic Model',
    'nodes': [...],
    'edges': [...]
}
cosmos_db.save_model(model_data)
"""