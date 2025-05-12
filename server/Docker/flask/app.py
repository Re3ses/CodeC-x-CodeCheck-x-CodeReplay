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
import psutil
import gc

from codebert_analyzer import CodeBERTAnalyzer, SnippetInfo
from structural_analysis import StructuralAnalysis


# Replace with a global variable
structural_detector = None


# Add a function for lazy loading
def get_structural_detector():
    global structural_detector
    if structural_detector is None:
        log_memory_usage("BEFORE STRUCTURAL ANALYSIS INIT")
        structural_detector = StructuralAnalysis()
        log_memory_usage("AFTER STRUCTURAL ANALYSIS INIT")
        # Force garbage collection after initialization
        gc.collect()
    return structural_detector


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


# Memory usage tracking function
def log_memory_usage(label=""):
    """Log current memory usage with an optional label"""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    memory_mb = memory_info.rss / 1024 / 1024  # Convert to MB
    logger.info(f"MEMORY USAGE {label}: {memory_mb:.2f} MB")
    return memory_mb


# Log initial memory usage
log_memory_usage("APP STARTUP")

# Configure CORS
# print("Loaded ALLOWED_ORIGINS:", os.getenv("ALLOWED_ORIGINS"))

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
print("Parsed allowed_origins:", allowed_origins)  # Debug print

# CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Configure rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["1000 per day", "50 per hour"],
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
logger.info("Initializing CodeBERT model...")
codebert_detector = None


def get_codebert():
    global codebert_detector
    if codebert_detector is None:
        log_memory_usage("BEFORE CODEBERT INIT")
        codebert_detector = CodeBERTAnalyzer()
        log_memory_usage("AFTER CODEBERT INIT")
        # Force garbage collection after initialization
        gc.collect()
    return codebert_detector


def compute_similarity_matrix_batched(snippets, batch_size=10):
    n = len(snippets)
    result_matrix = [[0 for _ in range(n)] for _ in range(n)]

    # Process in batches
    for i in range(0, n, batch_size):
        batch_end = min(i + batch_size, n)
        batch_snippets = snippets[i:batch_end]

        # Process this batch against all previous batches
        for j in range(0, i, batch_size):
            prev_batch_end = min(j + batch_size, n)
            prev_batch = snippets[j:prev_batch_end]

            # Compute similarity for these batches
            # ... implement similarity computation

        # Process this batch against itself
        # ... implement similarity computation

        # Force garbage collection after each batch
        gc.collect()

    return result_matrix, snippets


@app.route("/health", methods=["GET"])
@limiter.limit("100 per minute")
def health_check():
    """Simple health check endpoint"""
    memory_mb = log_memory_usage("HEALTH CHECK")
    return jsonify(
        {
            "status": "ok",
            "message": "Service is running",
            "memory_usage_mb": f"{memory_mb:.2f}",
        }
    )


@app.route("/api/similarity/matrix", methods=["GET"])
@limiter.limit("20 per minute")
def get_similarity_matrix():
    print("Similarity matrix request received.")
    log_memory_usage("MATRIX START")
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
        log_memory_usage("BEFORE DB QUERY")

        aggregation_pipeline = [{"$match": query}]

        # Apply highest-scoring filter per learner if enabled
        if highest_scoring_only:
            aggregation_pipeline += [
                {"$sort": {"score": -1}},  # Sort by score descending
                {"$group": {"_id": "$learner_id", "doc": {"$first": "$$ROOT"}}},
                {"$replaceRoot": {"newRoot": "$doc"}},
            ]

        submissions = list(userSubmissionsCollection.aggregate(aggregation_pipeline))
        log_memory_usage(f"AFTER DB QUERY - {len(submissions)} submissions")

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
        log_memory_usage(f"AFTER SNIPPETS CREATION - {len(snippets)} snippets")

        if not snippets:
            return jsonify(
                {
                    "success": True,
                    "matrix": [],
                    "snippets": [],
                    "message": f"No snippets found for problemId: {problem_id} or roomId: {room_id}",
                }
            )

        # Log data size before computation
        total_code_size = sum(len(snippet.code) for snippet in snippets)
        logger.info(
            f"Total code size: {total_code_size} characters across {len(snippets)} snippets"
        )

        # Add a size limit to prevent OOM
        if len(snippets) > 50:
            logger.warning(
                f"Large number of snippets ({len(snippets)}) may cause memory issues"
            )
            # Consider limiting the number of snippets if needed
            # snippets = snippets[:50]  # Uncomment to limit

        log_memory_usage("BEFORE MATRIX COMPUTATION")
        detector = get_codebert()
        matrix, snippet_info = detector.compute_similarity_matrix(snippets)
        log_memory_usage("AFTER MATRIX COMPUTATION")

        logger.info(
            f"Similarity matrix computation completed in {time.time() - start_time:.2f} seconds"
        )

        # Force garbage collection after heavy computation
        gc.collect()
        log_memory_usage("AFTER GARBAGE COLLECTION")

        response = jsonify(
            {"success": True, "matrix": matrix, "snippets": snippet_info}
        )
        return response

    except Exception as e:
        tb_str = traceback.format_exc()
        logger.error(f"Error in similarity matrix computation: {str(e)}\n{tb_str}")
        log_memory_usage("ERROR IN MATRIX COMPUTATION")
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


@app.route("/api/similarity/sequential", methods=["POST"])
@limiter.limit("50 per minute")
def get_sequential_similarity():
    print("Sequential similarity request received.")
    log_memory_usage("SEQUENTIAL START")
    start_time = time.time()
    try:
        data = request.get_json()
        snapshots = data.get("snapshots", [])
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

        # No snapshots passed, so fetch from DB
        log_memory_usage("BEFORE DB SNAPSHOTS QUERY")
        if not snapshots:
            snapshots = list(
                snapshotsCollection.find(
                    {
                        "learner_id": ObjectId(learner_id),
                        "problemId": problem_id,
                        "roomId": room_id,
                    }
                ).sort("submission_date", 1)
            )  # Sort by timestamp ascending
        log_memory_usage(f"AFTER DB SNAPSHOTS QUERY - {len(snapshots)} snapshots")

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
        log_memory_usage("BEFORE SEQUENTIAL COMPUTATION")

        detector = get_codebert()
        similarities = detector.compute_sequential_similarities(formatted_snapshots)
        log_memory_usage("AFTER SEQUENTIAL COMPUTATION")

        # Force garbage collection
        gc.collect()
        log_memory_usage("AFTER GARBAGE COLLECTION")

        logger.info(
            f"Sequential similarity computation completed in {time.time() - start_time:.2f} seconds"
        )
        return jsonify(
            {
                "success": True,
                "sequentialSimilarities": similarities,
                "snapshots": snapshots,
                "formatted_snapshots": formatted_snapshots,
            }
        )
    except Exception as e:
        tb_str = traceback.format_exc()
        logger.error(f"Error in sequential similarity computation: {str(e)}\n{tb_str}")
        log_memory_usage("ERROR IN SEQUENTIAL COMPUTATION")
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                }
            ),
            500,
        )


@app.route("/api/visualize-similarity", methods=["POST"])
@limiter.limit("50 per minute")
def visualize_similarity():
    log_memory_usage("VISUALIZE START")
    try:
        data = request.get_json()
        code1 = data.get("code1", "")
        code2 = data.get("code2", "")

        if not code1 or not code2:
            return jsonify({"success": False, "error": "Missing code samples"}), 400

        print(f"Analyzing code samples: {len(code1)}, {len(code2)} chars")
        log_memory_usage("BEFORE VISUALIZATION")

        # Get or initialize the structural detector
        detector = get_structural_detector()
        image, structures = detector.visualize_code_similarity(code1, code2)
        log_memory_usage("AFTER VISUALIZATION")

        # Force garbage collection
        gc.collect()
        log_memory_usage("AFTER GARBAGE COLLECTION")

        print(f"Analysis complete. Found {len(structures)} similar structures")

        return jsonify({"success": True, "image": image, "structures": structures})

    except Exception as e:
        tb_str = traceback.format_exc()
        logger.error(f"Error in visualization: {str(e)}\n{tb_str}")
        log_memory_usage("ERROR IN VISUALIZATION")
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("DEBUG_MODE", "False").lower() == "true"
    logger.info(f"Starting application on port {port}, debug mode: {debug_mode}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
