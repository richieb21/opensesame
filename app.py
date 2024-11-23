from flask import Flask, request, jsonify
from flask_cors import CORS
from broker import MessageBroker
from agents.for_agent import ForAgent
from agents.against_agent import AgainstAgent
from agents.judge_agent import JudgeAgent
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the message broker
broker = MessageBroker()

# Initialize agents
for_agent = ForAgent(broker)
against_agent = AgainstAgent(broker)
judge_agent = JudgeAgent(broker)

@app.route('/query', methods=['POST'])
def handle_query():
    try:
        data = request.json
        query = data.get('query', '')
        
        if not query:
            return jsonify({"error": "Query is required"}), 400

        # Send query to FOR and AGAINST agents
        broker.send_message(for_agent.create_message("judge_agent", query))
        broker.send_message(against_agent.create_message("judge_agent", query))

        # Judge waits for both responses and evaluates
        result = judge_agent.evaluate()

        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)
