# app.py
from flask import Flask, request, jsonify

# from flask_cors import CORS
import traceback
import time
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import logging
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from codebert_analyzer import CodeBERTAnalyzer, SnippetInfo

# Load environment variables
load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("app.log")],
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
print("Loaded ALLOWED_ORIGINS:", os.getenv("ALLOWED_ORIGINS"))

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
print("Parsed allowed_origins:", allowed_origins)  # Debug print

# CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Configure rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# Connect to the MongoDB server
MONGO_URI = os.getenv("MONGO_URI")
# print("Connecting to MongoDB server at:", MONGO_URI)
client = MongoClient(MONGO_URI)
db = client["codec"]
userSubmissionsCollection = db["usersubmissions"]
snapshotsCollection = db["codesnapshots"]

# Initialize detectors as global variables
codebert_detector = CodeBERTAnalyzer()


@app.route("/health", methods=["GET"])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "ok", "message": "Service is running"})


@app.route("/api/similarity/matrix", methods=["GET"])
@limiter.limit("10 per minute")
def get_similarity_matrix():
    print("Similarity matrix request received.")
    start_time = time.time()
    try:
        problem_id = request.args.get("problemId")
        room_id = request.args.get("roomId")
        verdict = request.args.get("verdict")
        user_type = request.args.get("userType")
        accept_partial_submissions = (
            request.args.get("acceptPartialSubmissions") == "true"
        )
        highest_scoring_only = request.args.get("highestScoringOnly") == "true"

        if not problem_id and not room_id:
            return (
                jsonify(
                    {"success": False, "message": "No problemId or roomId provided"}
                ),
                400,
            )

        query = {}

        # Only apply verdict filter if a specific verdict is provided
        if verdict:  # If a specific verdict is provided (not empty string)
            query["verdict"] = verdict
        # Don't set a default verdict when "All" is selected (empty string)

        # If accept_partial_submissions is enabled, add score filter
        if accept_partial_submissions:
            query["score"] = {"$gt": 0}

        if problem_id:
            query["problem"] = problem_id

        if room_id:
            query["room"] = room_id

        if user_type and user_type != "All":
            query["user_type"] = user_type

        print("query:", query)

        aggregation_pipeline = [{"$match": query}]

        # Apply highest-scoring filter per learner if enabled
        if highest_scoring_only:
            aggregation_pipeline += [
                {"$sort": {"score": -1}},  # Sort by score descending
                {"$group": {"_id": "$learner_id", "doc": {"$first": "$$ROOT"}}},
                {"$replaceRoot": {"newRoot": "$doc"}},
            ]

        submissions = list(userSubmissionsCollection.aggregate(aggregation_pipeline))

        for submission in submissions:
            submission["_id"] = str(submission["_id"])
            submission["learner_id"] = str(submission["learner_id"])

        logger.info(f"Found {len(submissions)} submissions matching the query")

        snippets = [
            SnippetInfo(
                learner=submission["learner"],
                learner_id=submission["learner_id"],
                file_name=f"{submission['learner']}_{problem_id}.js",
                code=submission["code"],
                timestamp=submission.get("submission_date", ""),
            )
            for submission in submissions
        ]

        if not snippets:
            return jsonify(
                {
                    "success": True,
                    "matrix": [],
                    "snippets": [],
                    "message": f"No snippets found for problemId: {problem_id} or roomId: {room_id}",
                }
            )

        matrix, snippet_info = codebert_detector.compute_similarity_matrix(snippets)

        logger.info(
            f"Similarity matrix computation completed in {time.time() - start_time:.2f} seconds"
        )

        response = jsonify(
            {"success": True, "matrix": matrix, "snippets": snippet_info}
        )
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Credentials", "true")

        return response

    except Exception as e:
        tb_str = traceback.format_exc()
        logger.error(f"Error in similarity matrix computation: {str(e)}\n{tb_str}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "matrix": [],
                    "snippets": [],
                }
            ),
            500,
        )


@app.route("/api/similarity/sequential", methods=["GET"])
@limiter.limit("10 per minute")
def get_sequential_similarity():
    print("Sequential similarity request received.")
    start_time = time.time()
    try:
        learner_id = request.args.get("learner_id")
        problem_id = request.args.get("problemId")
        room_id = request.args.get("roomId")

        if not all([learner_id, problem_id, room_id]):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Missing required parameters: learner_id, problemId, or roomId",
                    }
                ),
                400,
            )

        # Query MongoDB for the snapshots
        snapshots = list(
            snapshotsCollection.find(
                {
                    "learner_id": ObjectId(learner_id),
                    "problemId": problem_id,
                    "roomId": room_id,
                }
            ).sort("submission_date", 1)
        )  # Sort by timestamp ascending

        for snapshot in snapshots:
            snapshot["_id"] = str(snapshot["_id"])
            snapshot["learner_id"] = str(snapshot["learner_id"])

        logger.info(f"Found {len(snapshots)} snapshots for learner {learner_id}")

        if not snapshots:
            return jsonify(
                {
                    "success": True,
                    "sequentialSimilarities": [],
                    "message": f"No snapshots found for this learner and problem with the parameters: {learner_id}, {problem_id}, {room_id}",
                }
            )

        # Convert MongoDB documents to the format expected by compute_sequential_similarities
        formatted_snapshots = [
            {
                "learner_id": str(snapshot["learner_id"]),
                "code": snapshot["code"],
                "timestamp": snapshot.get("submission_date", ""),
                "submission_id": str(snapshot["_id"]),
            }
            for snapshot in snapshots
        ]

        similarities = codebert_detector.compute_sequential_similarities(
            formatted_snapshots
        )

        logger.info(
            f"Sequential similarity computation completed in {time.time() - start_time:.2f} seconds"
        )
        return jsonify(
            {
                "success": True,
                "sequentialSimilarities": similarities,
            }
        )
    except Exception as e:
        tb_str = traceback.format_exc()
        logger.error(f"Error in sequential similarity computation: {str(e)}\n{tb_str}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                }
            ),
            500,
        )


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("DEBUG_MODE", "False").lower() == "true"
    logger.info(f"Starting application on port {port}, debug mode: {debug_mode}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
