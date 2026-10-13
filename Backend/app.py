from flask import Flask, jsonify
from flask_cors import CORS

from database import init_db
from routes.schedule_routes import schedule_bp
from routes.jobs import jobs_bp
from routes.carbon import carbon_bp


app = Flask(__name__)

# Allow React frontend to communicate with Flask
CORS(app)


# Initialize database
init_db()


# Register API routes
app.register_blueprint(schedule_bp, url_prefix="/api")
app.register_blueprint(jobs_bp, url_prefix="/api")
app.register_blueprint(carbon_bp, url_prefix="/api")


@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "success": True,
        "message": "Carbon-Aware Scheduler Backend is running"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
