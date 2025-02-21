# main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import numpy as np
from detector_functions import EnhancedCodeSimilarityDetector
from trained_models import get_plagiarism_probability
from codebert_analyzer import CodeBERTAnalyzer, SnippetInfo
import traceback
import time
from pymongo import MongoClient  # type: ignore
from bson import ObjectId  # type: ignore

app = Flask(__name__)
CORS(app)

# Connect to the MongoDB server
client = MongoClient("mongodb://127.0.0.1:27017/codec-v3")
db = client["codec-v3"]
userSubmissionsCollection = db["usersubmissions"]
snapshotsCollection = db["codesnapshots"]

# Initialize detectors as global variables
token_detector = EnhancedCodeSimilarityDetector()
codebert_detector = CodeBERTAnalyzer()


@app.route("/compare", methods=["POST"])
def compare_submissions():
    start_time = time.time()
    try:
        print("compare request received")
        if request.json is None:
            return jsonify({"error": "No JSON payload received"}), 400

        data = request.json
        if "submissions" not in data:
            return jsonify({"error": "No submissions field in payload"}), 400

        submissions = data["submissions"]
        query = data["query"]
        model = query.get("model", "default")
        detection_type = query.get("detection_type", "token")

        # Convert submissions format
        converted_submissions = {}
        for submission in submissions:
            file_name = submission.get("learner", "unknown_learner")
            code = submission.get("code", "")
            language = submission.get("language_used", "unknown_language")
            converted_submissions[file_name] = {"code": code, "language": language}

        if detection_type == "token":
            comparison_results = token_detector.compare_files(
                converted_submissions, query
            )
        elif detection_type == "model":
            comparison_results = get_plagiarism_probability(
                submissions=converted_submissions, model_type=model
            )
        elif detection_type == "codebert":
            comparison_results = compute_codebert_similarities(submissions)

        return jsonify(comparison_results)

    except Exception as e:
        tb_str = traceback.format_exc()
        print(tb_str)
        return (
            jsonify({"error": str(e), "traceback": tb_str, "request": request.json}),
            500,
        )
    finally:
        print(f"Total time taken: {time.time() - start_time} seconds")


@app.route("/api/similarity/matrix", methods=["GET"])
def get_similarity_matrix():
    start_time = time.time()
    try:
        problem_id = request.args.get("problemId")
        room_id = request.args.get("roomId")

        if not problem_id and not room_id:
            return (
                jsonify(
                    {"success": False, "message": "No problemId or roomId provided"}
                ),
                400,
            )

        query = {"verdict": "ACCEPTED"}
        if problem_id:
            query["problem"] = problem_id
        if room_id:
            query["room"] = room_id

        submissions = list(userSubmissionsCollection.find(query))

        for submission in submissions:
            submission["_id"] = str(submission["_id"])
            submission["learner_id"] = str(submission["learner_id"])

        print("submissions", submissions)

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
                    "submissions": submissions,
                }
            )

        matrix, snippet_info = codebert_detector.compute_similarity_matrix(snippets)

        return jsonify({"success": True, "matrix": matrix, "snippets": snippet_info})

    except Exception as e:
        tb_str = traceback.format_exc()
        print(tb_str)
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "traceback": tb_str,
                    "matrix": [],
                    "snippets": [],
                }
            ),
            500,
        )
    finally:
        print(f"Total time taken: {time.time() - start_time} seconds")


@app.route("/api/similarity/sequential", methods=["GET"])
def get_sequential_similarity():
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
                "learner_id": str(snapshot["learner_id"]),  # Convert ObjectId to string
                "code": snapshot["code"],
                "timestamp": snapshot.get("submission_date", ""),
                "submission_id": str(snapshot["_id"]),  # Convert ObjectId to string
            }
            for snapshot in snapshots
        ]

        similarities = codebert_detector.compute_sequential_similarities(
            formatted_snapshots
        )

        return jsonify(
            {
                "success": True,
                "sequentialSimilarities": similarities,
                "message": "Sequential similarities computed successfully",
            }
        )
    except Exception as e:
        tb_str = traceback.format_exc()
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "traceback": tb_str,
                    "snapshots": snapshots,
                }
            ),
            500,
        )
    finally:
        print(f"Total time taken: {time.time() - start_time} seconds")


@app.route("/api/test", methods=["POST"])
def test_endpoint():
    try:
        # problem_id = request.args.get("problemId")
        # room_id = request.args.get("roomId")

        # if not problem_id and not room_id:
        #     return (
        #         jsonify(
        #             {"success": False, "message": "No problemId or roomId provided"}
        #         ),
        #         400,
        #     )

        # # submissions = list(
        # #     userSubmissionsCollection.find({"problem": problem_id, "room": room_id})
        # # )

        snapshots = list(snapshotsCollection.find({}))
        # Convert ObjectId to string
        for snapshot in snapshots:
            snapshot["_id"] = str(snapshot["_id"])
            snapshot["learner_id"] = str(snapshot["learner_id"])
        return jsonify(snapshots)
    except Exception as e:
        tb_str = traceback.format_exc()
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "traceback": tb_str,
                    "matrix": [],
                    "snippets": [],
                }
            ),
            500,
        )


def compute_codebert_similarities(submissions):
    """Compute similarities using CodeBERT for the existing comparison endpoint."""
    try:
        n = len(submissions)
        matrix = [[0.0] * n for _ in range(n)]

        for i in range(n):
            for j in range(i, n):
                if i == j:
                    similarity = 1.0
                else:
                    similarity = codebert_detector.calculate_similarity(
                        submissions[i]["code"], submissions[j]["code"]
                    )
                matrix[i][j] = matrix[j][i] = similarity

        # Format results to match your existing output structure
        results = {
            "similarity_matrix": matrix,
            "submission_info": [
                {
                    "learner": sub["learner"],
                    "language": sub.get("language_used", "unknown"),
                    "code_length": len(sub["code"]),
                }
                for sub in submissions
            ],
        }

        return results

    except Exception as e:
        print(f"Error in CodeBERT similarity computation: {e}")
        raise


if __name__ == "__main__":
    app.run(debug=True)
